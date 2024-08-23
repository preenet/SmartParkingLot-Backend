const { getConnection } = require('../services/dataService');

const addHistory = async (req, res) => {
  try {
    const conn = getConnection();
    const { license_id, access_date, access_type, image_source } = req.body;

    const historyData = { license_id, access_date, access_type, image_source };
    const [result] = await conn.query('INSERT INTO access_history SET ?', historyData);
    res.json({ message: 'Access History inserted successfully', result });
  } catch (error) {
    console.error('Error inserting access history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getHistory = async (req, res) => {
  try {
    const conn = getConnection();
    const [result] = await conn.query('SELECT * FROM access_history');
    res.json(result);
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addHistory, getHistory };
