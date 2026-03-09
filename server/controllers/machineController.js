const Machine = require('../models/Machine');

/**
 * @desc    Get all machines with optional status filter
 * @route   GET /api/machines
 * @access  Protected
 */
const getMachines = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const machines = await Machine.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: machines.length, data: machines });
  } catch (error) {
    console.error('Get machines error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching machines.' });
  }
};

/**
 * @desc    Get single machine by ID
 * @route   GET /api/machines/:id
 * @access  Protected
 */
const getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found.' });
    }
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Create a new machine
 * @route   POST /api/machines
 * @access  Admin
 */
const createMachine = async (req, res) => {
  try {
    const { name, capacity, rentalPricePerDay, location, description, status } = req.body;

    if (!name || !capacity || !rentalPricePerDay || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name, capacity, rental price per day, and location are required.',
      });
    }

    const machine = await Machine.create({
      name,
      capacity,
      rentalPricePerDay,
      location,
      description,
      status: status || 'Available',
    });

    res.status(201).json({ success: true, message: 'Machine created successfully.', data: machine });
  } catch (error) {
    console.error('Create machine error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error creating machine.' });
  }
};

/**
 * @desc    Update a machine
 * @route   PUT /api/machines/:id
 * @access  Admin
 */
const updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found.' });
    }

    const { name, capacity, rentalPricePerDay, location, status, description, lastMaintenanceDate } = req.body;

    if (name) machine.name = name;
    if (capacity) machine.capacity = capacity;
    if (rentalPricePerDay !== undefined) machine.rentalPricePerDay = rentalPricePerDay;
    if (location) machine.location = location;
    if (status) machine.status = status;
    if (description !== undefined) machine.description = description;
    if (lastMaintenanceDate) machine.lastMaintenanceDate = lastMaintenanceDate;

    const updated = await machine.save();
    res.status(200).json({ success: true, message: 'Machine updated successfully.', data: updated });
  } catch (error) {
    console.error('Update machine error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error updating machine.' });
  }
};

/**
 * @desc    Delete a machine
 * @route   DELETE /api/machines/:id
 * @access  Admin
 */
const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found.' });
    }

    // Prevent deletion if machine is currently rented
    if (machine.status === 'Rented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a machine that is currently rented.',
      });
    }

    await machine.deleteOne();
    res.status(200).json({ success: true, message: 'Machine deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting machine.' });
  }
};

/**
 * @desc    Get dashboard stats
 * @route   GET /api/machines/stats
 * @access  Protected
 */
const getMachineStats = async (req, res) => {
  try {
    const total = await Machine.countDocuments();
    const available = await Machine.countDocuments({ status: 'Available' });
    const rented = await Machine.countDocuments({ status: 'Rented' });
    const maintenance = await Machine.countDocuments({ status: 'Maintenance' });

    res.status(200).json({
      success: true,
      data: { total, available, rented, maintenance },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getMachines, getMachineById, createMachine, updateMachine, deleteMachine, getMachineStats };
