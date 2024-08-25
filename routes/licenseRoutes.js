const express = require('express');
const router = express.Router();
const { addLicense, getAllLicensePlates, deleteLicense, editLicense, getLicensePlatesById } = require('../controllers/licenseController');

router.post('/addLicense', addLicense);
router.get('/licensePlates', getAllLicensePlates);
router.get('/licensePlates/:id', getLicensePlatesById);
router.delete('/deleteLicense/:id', deleteLicense);
router.put('/editLicense/:id', editLicense);

module.exports = router;
