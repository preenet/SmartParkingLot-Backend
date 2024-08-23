const express = require('express');
const router = express.Router();
const { addHistory, getHistory } = require('../controllers/historyController');

router.post('/addHistory', addHistory);
router.get('/history', getHistory);

module.exports = router;
