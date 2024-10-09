const express = require('express');
const router = express.Router();
const { addLicense, getAllLicensePlates, deleteLicense, editLicense, getLicensePlatesById, addUnknown, getAllUnknown } = require('../controllers/licenseController');

router.post('/addLicense', addLicense);
router.get('/licensePlates', getAllLicensePlates);
router.get('/licensePlates/:id', getLicensePlatesById);
router.delete('/deleteLicense/:id', deleteLicense);
router.put('/editLicense/:id', editLicense);
router.post('/addUnknown', addUnknown);
router.get('/getAllUnknown', getAllUnknown);

module.exports = router;
