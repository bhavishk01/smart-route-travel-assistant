const express = require('express');
const router = express.Router();
const { googleLogin, signup, login } = require('../controllers/authController');

router.post('/google', googleLogin);
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;