const express = require('express');
const router = express.Router();
const {  login, auth } = require('../controllers/authController');

// router.post('/register', register);
router.post('/login', login);
router.get('/auth', auth);

module.exports = router;
