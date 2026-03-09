const Maintenance = require('../models/Maintenance');
const Machine = require('../models/Machine');

/**
 * @desc    Get all maintenance records
 * @route   GET /api/maintenance
 * @access  Protected
 */
const getMaintenanceRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.query.machineId) filter.machineId = req.query.machineId;
    if (req.query.status) filter.status = req.query.status;

    const records = await Maintenance.find(filter)
      .populate('machineId', 'name capacity location status')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching maintenance records.' });
  }
};

/**
 * @desc    Get single maintenance record
 * @route   GET /api/maintenance/:id
 * @access  Protected
 */
const getMaintenanceById = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate('machineId', 'name capacity location')
      .populate('createdBy', 'name email');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Create maintenance record and set machine status to Maintenance
 * @route   POST /api/maintenance
 * @access  Protected
 */
const createMaintenance = async (req, res) => {
  try {
    const { machineId, date, issue, cost, nextMaintenanceDate, resolvedBy, status, notes } = req.body;

    if (!machineId || !issue || cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Machine, issue description, and cost are required.',
      });
    }

    // Verify machine exists
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found.' });
    }

    const record = await Maintenance.create({
      machineId,
      date: date || new Date(),
      issue,
      cost,
      nextMaintenanceDate,
      resolvedBy,
      status: status || 'Completed',
      notes,
      createdBy: req.user._id,
    });

    // If maintenance is scheduled/in-progress, update machine status
    if (status === 'Scheduled' || status === 'In Progress') {
      machine.status = 'Maintenance';
      await machine.save();
    }

    // If completed, update lastMaintenanceDate and set machine to Available
    if (!status || status === 'Completed') {
      machine.lastMaintenanceDate = date || new Date();
      if (machine.status === 'Maintenance') {
        machine.status = 'Available';
      }
      await machine.save();
    }

    const populated = await Maintenance.findById(record._id)
      .populate('machineId', 'name capacity location')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully.',
      data: populated,
    });
  } catch (error) {
    console.error('Create maintenance error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update maintenance record
 * @route   PUT /api/maintenance/:id
 * @access  Protected
 */
const updateMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    const { issue, cost, nextMaintenanceDate, resolvedBy, status, notes, date } = req.body;

    if (issue) record.issue = issue;
    if (cost !== undefined) record.cost = cost;
    if (nextMaintenanceDate) record.nextMaintenanceDate = nextMaintenanceDate;
    if (resolvedBy) record.resolvedBy = resolvedBy;
    if (notes !== undefined) record.notes = notes;
    if (date) record.date = date;

    // Handle status transition
    if (status && status !== record.status) {
      record.status = status;
      const machine = await Machine.findById(record.machineId);
      if (machine) {
        if (status === 'Completed') {
          machine.lastMaintenanceDate = record.date;
          if (machine.status === 'Maintenance') machine.status = 'Available';
          await machine.save();
        } else if (status === 'In Progress' || status === 'Scheduled') {
          machine.status = 'Maintenance';
          await machine.save();
        }
      }
    }

    const updated = await record.save();
    const populated = await Maintenance.findById(updated._id)
      .populate('machineId', 'name capacity location status')
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, message: 'Maintenance updated.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get maintenance stats
 * @route   GET /api/maintenance/stats
 * @access  Protected
 */
const getMaintenanceStats = async (req, res) => {
  try {
    const totalRecords = await Maintenance.countDocuments();
    const costResult = await Maintenance.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$cost' } } },
    ]);
    const totalCost = costResult[0]?.totalCost || 0;

    res.status(200).json({ success: true, data: { totalRecords, totalCost } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  getMaintenanceStats,
};
