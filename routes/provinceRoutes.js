const express = require('express');
const router = express.Router();
const { getProvinces } = require('../controllers/provinceController');

router.get('/province', getProvinces);

module.exports = router;
