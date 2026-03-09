const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
  {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'Machine is required'],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalRent: {
      type: Number,
      required: true,
      min: [0, 'Total rent cannot be negative'],
    },
    advancePayment: {
      type: Number,
      default: 0,
      min: [0, 'Advance payment cannot be negative'],
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Auto-calculate remainingBalance before saving
rentalSchema.pre('save', function (next) {
  this.remainingBalance = this.totalRent - this.advancePayment;
  next();
});

module.exports = mongoose.model('Rental', rentalSchema);
