const { getConnection } = require('../services/dataService');

const addDetect = async (req, res) => {
    try {
      const conn = getConnection();
      const { no_of_cars, no_of_empty, detection_date, image_source } = req.body;

    // Check for missing fields
    if (!no_of_cars || !no_of_empty || !detection_date || !image_source) {
      return res.status(400).json({ message: 'Missing required fields' });
    }     

      const detectionData = { no_of_cars, no_of_empty, detection_date, image_source  };
      const [result] = await conn.query('INSERT INTO detection_history SET ?', detectionData);
      res.json({ message: 'Detection data inserted successfully', result });
    } catch (error) {
      console.error('Error inserting license plate:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  const getDetection = async (req, res) => {
    try {
      const conn = getConnection();
      const [result] = await conn.query('SELECT * FROM detection_history');
      res.json(result);
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = { addDetect, getDetection };
  