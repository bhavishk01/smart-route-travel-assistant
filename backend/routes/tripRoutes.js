const express = require('express');
const router = express.Router();
const { planTrip } = require('../controllers/tripController');

router.post('/plan', planTrip);

module.exports = router;