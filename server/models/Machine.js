const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
    },
    capacity: {
      type: String,
      required: [true, 'Capacity is required'],
      trim: true,
    },
    rentalPricePerDay: {
      type: Number,
      required: [true, 'Rental price per day is required'],
      min: [0, 'Rental price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Available', 'Rented', 'Maintenance'],
      default: 'Available',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lastMaintenanceDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Machine', machineSchema);
