const { getConnection } = require('../services/dataService');

const getProvinces = async (req, res) => {
  try {
    const conn = getConnection();
    if (!conn) {
      throw new Error('Database connection not initialized');
    }
    const [result] = await conn.query('SELECT * FROM provinces');
    res.json({ result });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProvinces };
