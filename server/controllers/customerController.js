const Customer = require('../models/Customer');
const Rental = require('../models/Rental');

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Protected
 */
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching customers.' });
  }
};

/**
 * @desc    Get single customer by ID with rental history
 * @route   GET /api/customers/:id
 * @access  Protected
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Fetch rental history for this customer
    const rentals = await Rental.find({ customerId: req.params.id })
      .populate('machineId', 'name capacity location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { ...customer.toObject(), rentalHistory: rentals },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Protected
 */
const createCustomer = async (req, res) => {
  try {
    const { name, phone, cnic, address, email } = req.body;

    if (!name || !phone || !cnic || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, CNIC, and address are required.',
      });
    }

    // Check duplicate CNIC
    const existing = await Customer.findOne({ cnic });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this CNIC already exists.',
      });
    }

    const customer = await Customer.create({ name, phone, cnic, address, email });
    res.status(201).json({ success: true, message: 'Customer created successfully.', data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'CNIC already registered.' });
    }
    res.status(500).json({ success: false, message: 'Server error creating customer.' });
  }
};

/**
 * @desc    Update customer information
 * @route   PUT /api/customers/:id
 * @access  Protected
 */
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const { name, phone, cnic, address, email, isActive } = req.body;

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (cnic) customer.cnic = cnic;
    if (address) customer.address = address;
    if (email !== undefined) customer.email = email;
    if (isActive !== undefined) customer.isActive = isActive;

    const updated = await customer.save();
    res.status(200).json({ success: true, message: 'Customer updated successfully.', data: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error updating customer.' });
  }
};

/**
 * @desc    Soft delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Admin
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Check for active rentals
    const activeRental = await Rental.findOne({
      customerId: req.params.id,
      status: { $in: ['Pending', 'Active'] },
    });
    if (activeRental) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a customer with active rentals.',
      });
    }

    customer.isActive = false;
    await customer.save();
    res.status(200).json({ success: true, message: 'Customer deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };
