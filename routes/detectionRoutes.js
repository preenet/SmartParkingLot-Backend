const express = require('express');
const router = express.Router();
const { addDetect,getDetection } = require('../controllers/detectionController');

router.post('/addDetect', addDetect);
router.get('/detection', getDetection);


module.exports = router;
