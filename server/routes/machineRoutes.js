const express = require('express');
const router = express.Router();
const {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachineStats,
} = require('../controllers/machineController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Stats endpoint must come before /:id to avoid conflict
router.get('/stats', protect, getMachineStats);

router.route('/')
  .get(protect, getMachines)
  .post(protect, isAdmin, createMachine);

router.route('/:id')
  .get(protect, getMachineById)
  .put(protect, isAdmin, updateMachine)
  .delete(protect, isAdmin, deleteMachine);

module.exports = router;
