const express = require('express');
const router = express.Router();
const {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  getMaintenanceStats,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getMaintenanceStats);

router.route('/')
  .get(protect, getMaintenanceRecords)
  .post(protect, createMaintenance);

router.route('/:id')
  .get(protect, getMaintenanceById)
  .put(protect, updateMaintenance);

module.exports = router;
