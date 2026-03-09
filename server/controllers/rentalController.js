const Rental = require('../models/Rental');
const Machine = require('../models/Machine');
const Customer = require('../models/Customer');

/**
 * Helper: calculate total rent from dates and price per day
 * Uses Math.ceil to round up partial days
 */
const calculateTotalRent = (startDate, endDate, pricePerDay) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  if (diffMs <= 0) throw new Error('End date must be after start date.');
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays * pricePerDay;
};

/**
 * @desc    Get all rentals with populated references
 * @route   GET /api/rentals
 * @access  Protected
 */
const getRentals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customerId) filter.customerId = req.query.customerId;
    if (req.query.machineId) filter.machineId = req.query.machineId;

    const rentals = await Rental.find(filter)
      .populate('machineId', 'name capacity rentalPricePerDay location status')
      .populate('customerId', 'name phone cnic address')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: rentals.length, data: rentals });
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching rentals.' });
  }
};

/**
 * @desc    Get single rental by ID
 * @route   GET /api/rentals/:id
 * @access  Protected
 */
const getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('machineId', 'name capacity rentalPricePerDay location status')
      .populate('customerId', 'name phone cnic address')
      .populate('createdBy', 'name email role');

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found.' });
    }
    res.status(200).json({ success: true, data: rental });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Create a new rental
 *          - Auto-calculates totalRent from (EndDate - StartDate) * rentalPricePerDay
 *          - Auto-updates machine status to 'Rented'
 * @route   POST /api/rentals
 * @access  Protected
 */
const createRental = async (req, res) => {
  try {
    const { machineId, customerId, startDate, endDate, advancePayment, notes } = req.body;

    // Validate required fields
    if (!machineId || !customerId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Machine, customer, start date, and end date are required.',
      });
    }

    // Verify machine exists and is available
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found.' });
    }
    if (machine.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Machine is currently "${machine.status}" and cannot be rented.`,
      });
    }

    // Verify customer exists and is active
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    if (!customer.isActive) {
      return res.status(400).json({ success: false, message: 'Customer account is deactivated.' });
    }

    // ── CORE LOGIC: Auto-calculate totalRent ──────────────────────────────────
    let totalRent;
    try {
      totalRent = calculateTotalRent(startDate, endDate, machine.rentalPricePerDay);
    } catch (calcErr) {
      return res.status(400).json({ success: false, message: calcErr.message });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const advance = Number(advancePayment) || 0;

    if (advance > totalRent) {
      return res.status(400).json({
        success: false,
        message: 'Advance payment cannot exceed total rent.',
      });
    }

    // Create the rental record
    const rental = await Rental.create({
      machineId,
      customerId,
      startDate,
      endDate,
      totalRent,
      advancePayment: advance,
      remainingBalance: totalRent - advance,
      status: 'Active',
      notes,
      createdBy: req.user._id,
    });

    // ── CORE LOGIC: Auto-update machine status to 'Rented' ────────────────────
    machine.status = 'Rented';
    await machine.save();
    // ─────────────────────────────────────────────────────────────────────────

    // Return populated rental
    const populatedRental = await Rental.findById(rental._id)
      .populate('machineId', 'name capacity rentalPricePerDay location')
      .populate('customerId', 'name phone cnic')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Rental created successfully.',
      data: populatedRental,
    });
  } catch (error) {
    console.error('Create rental error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error creating rental.' });
  }
};

/**
 * @desc    Update rental status and handle machine status accordingly
 * @route   PUT /api/rentals/:id
 * @access  Protected
 */
const updateRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found.' });
    }

    const { status, advancePayment, notes, endDate } = req.body;
    const oldStatus = rental.status;

    // Update allowed fields
    if (advancePayment !== undefined) {
      rental.advancePayment = Number(advancePayment);
      if (rental.advancePayment > rental.totalRent) {
        return res.status(400).json({
          success: false,
          message: 'Advance payment cannot exceed total rent.',
        });
      }
      rental.remainingBalance = rental.totalRent - rental.advancePayment;
    }

    if (notes !== undefined) rental.notes = notes;

    // Handle end date change — recalculate totalRent
    if (endDate) {
      const machine = await Machine.findById(rental.machineId);
      if (machine) {
        try {
          rental.totalRent = calculateTotalRent(rental.startDate, endDate, machine.rentalPricePerDay);
          rental.endDate = endDate;
          rental.remainingBalance = rental.totalRent - rental.advancePayment;
        } catch (calcErr) {
          return res.status(400).json({ success: false, message: calcErr.message });
        }
      }
    }

    if (status) {
      rental.status = status;

      // If rental is completed or cancelled, set machine back to Available
      if ((status === 'Completed' || status === 'Cancelled') && oldStatus !== status) {
        const machine = await Machine.findById(rental.machineId);
        if (machine && machine.status === 'Rented') {
          machine.status = 'Available';
          await machine.save();
        }
      }

      // If rental is reactivated from Pending, set machine to Rented
      if (status === 'Active' && oldStatus === 'Pending') {
        const machine = await Machine.findById(rental.machineId);
        if (machine) {
          machine.status = 'Rented';
          await machine.save();
        }
      }
    }

    const updated = await rental.save();
    const populatedRental = await Rental.findById(updated._id)
      .populate('machineId', 'name capacity rentalPricePerDay location status')
      .populate('customerId', 'name phone cnic');

    res.status(200).json({
      success: true,
      message: 'Rental updated successfully.',
      data: populatedRental,
    });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({ success: false, message: 'Server error updating rental.' });
  }
};

/**
 * @desc    Get rental statistics for dashboard
 * @route   GET /api/rentals/stats
 * @access  Protected
 */
const getRentalStats = async (req, res) => {
  try {
    const total = await Rental.countDocuments();
    const active = await Rental.countDocuments({ status: 'Active' });
    const completed = await Rental.countDocuments({ status: 'Completed' });
    const pending = await Rental.countDocuments({ status: 'Pending' });

    // Total revenue from completed rentals
    const revenueResult = await Rental.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalRent' }, totalCollected: { $sum: '$advancePayment' } } },
    ]);
    const revenue = revenueResult[0] || { totalRevenue: 0, totalCollected: 0 };

    // Monthly rentals for current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Rental.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalRent' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        completed,
        pending,
        totalRevenue: revenue.totalRevenue,
        totalCollected: revenue.totalCollected,
        monthlyStats,
      },
    });
  } catch (error) {
    console.error('Rental stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getRentals, getRentalById, createRental, updateRental, getRentalStats };
