const { getConnection } = require('../services/dataService');

const addDetect = async (req, res) => {
  try {
    const conn = getConnection();
    const detections = req.body;

    // Ensure the request body is an array
    if (!Array.isArray(detections)) {
      return res.status(400).json({ message: 'Request body must be an array' });
    }

    // Check for missing fields in each object
    for (const detection of detections) {
      const { no_of_cars, no_of_empty, detection_date, image_source } = detection;

      if (!no_of_cars || !no_of_empty || !detection_date || !image_source) {
        return res.status(400).json({ message: 'Missing required fields in one of the objects' });
      }
    }

    // Insert each detection into the database
    const insertPromises = detections.map(detection => {
      const { no_of_cars, no_of_empty, detection_date, image_source } = detection;
      const detectionData = { no_of_cars, no_of_empty, detection_date, image_source };
      return conn.query('INSERT INTO detection_history SET ?', detectionData);
    });

    // Wait for all insert operations to complete
    await Promise.all(insertPromises);

    res.json({ message: 'Detection data inserted successfully' });
  } catch (error) {
    console.error('Error inserting detection data:', error);
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
  