const { getConnection } = require("../services/dataService");

const addLicense = async (req, res) => {
  try {
    const conn = getConnection();
    const { first_name, last_name, license_number, province_id } = req.body;

    // Updated regex to allow letters and numbers within specified lengths
    const firstnameRegex = /^[ก-๙a-zA-Z]{2,20}$/; // 2-20 characters
    if (!firstnameRegex.test(first_name)) {
      return res.status(400).send({ message: 'First Name must be alphanumeric and between 2-20 characters long with no spaces.' });
    }

    const lastnameRegex = /^[ก-๙a-zA-Z]{2,20}$/; // 2-20 characters
    if (!lastnameRegex.test(last_name)) {
      return res.status(400).send({ message: 'Last Name must be alphanumeric and between 2-20 characters long with no spaces.' });
    }

    const licensenumberRegex = /^[ก-๙a-zA-Z0-9]{3,10}$/; // 3-10 characters
    if (!licensenumberRegex.test(license_number)) {
      return res.status(400).send({ message: 'License Number must be alphanumeric and between 3-10 characters long with no spaces.' });
    }

    // Check if province exists
    const [existingProvince] = await conn.query(
      "SELECT * FROM provinces WHERE id = ?",
      [province_id]
    );
    if (existingProvince.length === 0) {
      return res.status(400).json({ message: "Invalid province ID" });
    }

    // Check if license already exists for the province
    const [existingLicense] = await conn.query(
      "SELECT * FROM license_plate WHERE license_number = ? AND province_id = ?",
      [license_number, province_id]
    );
    if (existingLicense.length > 0) {
      return res.status(400).json({ message: "License number already exists for this province" });
    }

    // Insert the new license plate
    const licenseData = { first_name, last_name, license_number, province_id };
    const [result] = await conn.query(
      "INSERT INTO license_plate SET ?",
      licenseData
    );
    res.json({ message: "License plate inserted successfully", result });
  } catch (error) {
    console.error("Error inserting license plate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getAllLicensePlates = async (req, res) => {
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
    console.log("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLicensePlatesById = async (req, res) => {
  try {
    const conn = getConnection();
    const { id } = req.params;
    const [result] = await conn.query(
      "SELECT lp.*, p.province FROM license_plate lp JOIN provinces p ON lp.province_id = p.id WHERE lp.id = ?",
      [id]
    );
    if (result.length === 0) {
      return res.status(404).json({ message: "License plate not found" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching license plate data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const deleteLicense = async (req, res) => {
  let conn; // Declare conn here to handle rollback
  try {
    conn = getConnection();
    const { id } = req.params;
    console.log("Deleting license plate with ID:", id);

    // Start a transaction
    await conn.query('START TRANSACTION');

    // Delete related records from access_history first
    await conn.query(
      "DELETE FROM access_history WHERE license_id = ?",
      id
    );

    // Then delete the license plate
    const result = await conn.query(
      "DELETE FROM license_plate WHERE id = ?",
      id
    );

    // Ensure result is an array and check affectedRows
    const licenseResult = Array.isArray(result) && result.length > 0 ? result[0] : result;

    console.log("License plate deleted:", licenseResult);

    // Check if the license plate was found and deleted
    if (!licenseResult || licenseResult.affectedRows === 0) {
      console.log("No license plate found for ID:", id);
      await conn.query('ROLLBACK'); // Rollback the transaction before returning 404
      return res.status(404).json({ message: "License plate not found" });
    }

    // Commit the transaction
    await conn.query('COMMIT');

    res.json({ message: "License plate and related access history deleted successfully" });
  } catch (error) {
    console.log("Error deleting license plate:", error);

    // Rollback the transaction in case of error
    if (conn) {
      await conn.query('ROLLBACK');
    }
    res.status(500).json({ error: "Internal server error" });
  }
};











const editLicense = async (req, res) => {
  try {
    const conn = getConnection();
    const { id } = req.params;
    const { first_name, last_name, license_number, province_id } = req.body;

    console.log('Received data:', { id, first_name, last_name, license_number, province_id });

    // Check if the license exists
    const [existingLicense] = await conn.query(
      "SELECT * FROM license_plate WHERE id = ?",
      [id]
    );
    if (existingLicense.length === 0) {
      return res.status(404).json({ message: "License plate not found" });
    }

    // Check if the province exists
    const [existingProvince] = await conn.query(
      "SELECT * FROM provinces WHERE id = ?",
      [province_id]
    );
    if (existingProvince.length === 0) {
      return res.status(400).json({ message: "Invalid province ID" });
    }

    // Define updatedData
    const updatedData = { first_name, last_name, license_number, province_id };
    
    // Update the license information
    const [result] = await conn.query(
      "UPDATE license_plate SET ? WHERE id = ?",
      [updatedData, id]
    );
    res.json({ message: "License plate updated successfully", result });
  } catch (error) {
    console.error("Error updating license plate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addUnknown = async (req, res) => {
  try {
    const conn = getConnection();
    const { access_date, license_number, image_source } = req.body;

    const unknownData = { access_date, license_number, image_source };
    const [result] = await conn.query('INSERT INTO license_plate_unknown SET ?', unknownData);
    res.json({ message: 'License Plate Unknown inserted successfully', result });
  } catch (error) {
    console.error('Error inserting linense plate unknow:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllUnknown= async (req, res) => {
  try {
    const conn = getConnection();
    const [result] = await conn.query('SELECT * FROM license_plate_unknown');
    res.json(result);
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = { addLicense, getAllLicensePlates, deleteLicense, editLicense, getLicensePlatesById, addUnknown, getAllUnknown };
