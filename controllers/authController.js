const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../services/dataService');
const secret = process.env.SECRET || "mysecret";

// const register = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const passwordHash = await bcrypt.hash(password, 10);
//     const userData = { username, password: passwordHash };
//     const [result] = await conn.query('INSERT INTO users SET ?', userData);
//     res.json({ message: 'insert ok la', result });
//   } catch (error) {
//     console.log('error', error);
//     res.json({ message: 'insert error la', error });
//   }
// };

const login = async (req, res) => {
    try {
      const conn = getConnection();
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).send({ message: "Please enter username or password" });
      }
  
      const [result] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
      if (!result.length) {
        return res.status(400).send({ message: "Invalid email or password" });
      }
  
      const user = result[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).send({ message: "Invalid email or password" });
      }
  
      const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '1h' });
      res.send({ message: "Login successful", token });
    } catch (error) {
      console.log('Error in /api/login:', error);
      res.status(500).send({ message: 'An error occurred while logging in' });
    }
  };
  
  const auth = async (req, res) => {
    try {
      const conn = getConnection();
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
  
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Token missing' });
      }
  
      const user = jwt.verify(token, secret);
      if (!user || !user.username) {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      const [checkResult] = await conn.query('SELECT * FROM users WHERE username = ?', user.username);
      if (!checkResult.length) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const [result] = await conn.query('SELECT * FROM users');
      res.json({ users: result[0] });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

module.exports = {  login, auth };
