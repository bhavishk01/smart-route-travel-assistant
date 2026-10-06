const express = require('express');
const router = express.Router();
const { planTrip, getHistory, getHistoryDetail } = require('../controllers/tripController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/plan', requireAuth, planTrip);
router.get('/history', requireAuth, getHistory);
router.get('/history/:id', requireAuth, getHistoryDetail);

module.exports = router;