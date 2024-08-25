const express = require('express');
const router = express.Router();
const { addLicense, getLicensePlates, deleteLicense, editLicense } = require('../controllers/licenseController');

router.post('/addLicense', addLicense);
router.get('/licensePlates', getLicensePlates);
router.delete('/deleteLicense/:id', deleteLicense);
router.put('/editLicense/:id', editLicense);

module.exports = router;
