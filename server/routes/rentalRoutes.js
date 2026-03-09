const express = require('express');
const router = express.Router();
const {
  getRentals,
  getRentalById,
  createRental,
  updateRental,
  getRentalStats,
} = require('../controllers/rentalController');
const { protect } = require('../middleware/authMiddleware');

// Stats must come before /:id
router.get('/stats', protect, getRentalStats);

router.route('/')
  .get(protect, getRentals)
  .post(protect, createRental);

router.route('/:id')
  .get(protect, getRentalById)
  .put(protect, updateRental);

module.exports = router;
