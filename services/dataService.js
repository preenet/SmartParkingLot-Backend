const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { writeToStream } = require('@fast-csv/format');
const { bucket } = require('./firebaseService');
const bcrypt = require('bcrypt'); 

let conn = null;

const initDatabase = async () => {
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });

    console.log('Database connected successfully');

    // Create tables if they don't exist
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS provinces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        province VARCHAR(255) NOT NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS license_plate (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        license_number VARCHAR(255) NOT NULL,
        province_id INT NOT NULL,
        FOREIGN KEY (province_id) REFERENCES provinces(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS access_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        license_id INT NOT NULL,
        access_date DATETIME NOT NULL,
        access_type VARCHAR(255) NOT NULL,
        image_source VARCHAR(255) NOT NULL,
        FOREIGN KEY (license_id) REFERENCES license_plate(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS detection_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        no_of_cars INT NOT NULL,
        no_of_empty INT NOT NULL,
        detection_date DATETIME NOT NULL,
        image_source VARCHAR(255) NOT NULL
      )
    `);

        // Insert initial user data
        const username = 'test01';
        const password = '123';
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    
        const [userRows] = await conn.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
        if (userRows[0].count === 0) {
          await conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
          console.log(`User ${username} added to the database`);
        } else {
          console.log(`User ${username} already exists in the database`);
        }

    // Check if the provinces table is empty
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM provinces');
    if (rows[0].count === 0) {
      // Insert initial provinces data
      const provincesList = [
        "กระบี่", "กรุงเทพมหานคร", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
        "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่",
        "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
        "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ",
        "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา",
        "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่",
        "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง",
        "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
        "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว",
        "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู",
        "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
      ];

      const values = provincesList.map(province => [province]);

      await conn.query('INSERT INTO provinces (province) VALUES ?', [values]);

      console.log('Provinces added to the database');
    } else {
      console.log('Provinces table already initialized');
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

const queryDataAndExportToCSV = async () => {
  try {
    const [rows] = await conn.execute("SELECT * FROM license_plate");
    const jsonData = JSON.parse(JSON.stringify(rows));

    const csvFilePath = path.join(__dirname, '..', 'license_plate_data.csv');
    const ws = fs.createWriteStream(csvFilePath);

    writeToStream(ws, jsonData, { headers: true })
      .on('finish', async () => {
        console.log('CSV file has been written successfully');
        await bucket.upload(csvFilePath, {
          destination: 'license_plate_data.csv',
          metadata: { contentType: 'text/csv' },
        });
        console.log('CSV file has been uploaded to Firebase Storage');
      });
  } catch (error) {
    console.error("Error querying data:", error);
  }
};

const getConnection = () => conn;

module.exports = { initDatabase, queryDataAndExportToCSV, getConnection };
