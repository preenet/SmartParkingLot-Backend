const express = require('express');
const router = express.Router();
const { addLicense, getLicensePlates, deleteLicense } = require('../controllers/licenseController');

router.post('/addLicense', addLicense);
router.get('/licensePlates', getLicensePlates);
router.delete('/deleteLicense/:id', deleteLicense);

module.exports = router;
