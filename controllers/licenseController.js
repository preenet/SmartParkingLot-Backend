const { getConnection } = require('../services/dataService');

const addLicense = async (req, res) => {
  try {
    const conn = getConnection();
    const { first_name, last_name, license_number, province_id } = req.body;

    const [existingProvince] = await conn.query('SELECT * FROM provinces WHERE id = ?', [province_id]);
    if (existingProvince.length === 0) {
      return res.status(400).json({ message: 'Invalid province ID' });
    }

    const [existingLicense] = await conn.query('SELECT * FROM license_plate WHERE license_number = ? AND province_id = ?', [license_number, province_id]);
    if (existingLicense.length > 0) {
      return res.status(400).json({ message: 'License number already exists for this province' });
    }

    const licenseData = { first_name, last_name, license_number, province_id };
    const [result] = await conn.query('INSERT INTO license_plate SET ?', licenseData);
    res.json({ message: 'License plate inserted successfully', result });
  } catch (error) {
    console.error('Error inserting license plate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getLicensePlates = async (req, res) => {
  try {
    const conn = getConnection();
    const query = `
      SELECT lp.*, p.province
      FROM license_plate lp
      JOIN provinces p ON lp.province_id = p.id
    `;
    const [result] = await conn.query(query);
    res.json(result);
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteLicense = async (req, res) => {
  try {
    const conn = getConnection();
    const { id } = req.params;
    console.log('Deleting license plate with ID:', id);
    const [result] = await conn.query('DELETE FROM license_plate WHERE id = ?', id);
    console.log('Query result:', result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'License plate not found' });
    }
    res.json({ message: 'License plate deleted successfully' });
  } catch (error) {
    console.log('Error deleting license plate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addLicense, getLicensePlates, deleteLicense };
