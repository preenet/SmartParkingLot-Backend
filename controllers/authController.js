const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../services/dataService');
const secret = process.env.SECRET || "mysecret";

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const usernameRegex = /^[a-zA-Z0-9]{5,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).send({ message: 'Username must be alphanumeric and between 5-20 characters long with no spaces.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send({ 
        message: 'Password must be 8-30 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userData = { username, password: passwordHash };
    const [result] = await conn.query('INSERT INTO users SET ?', userData);
    res.json({ message: 'Insert Successful', result });
  } catch (error) {
    console.log('error', error);
    res.json({ message: 'insert error la', error });
  }
};

const login = async (req, res) => {
  try {
    const conn = getConnection();
    const { username, password } = req.body;

    const usernameRegex = /^[a-zA-Z0-9]{5,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).send({ message: 'Username must be alphanumeric and between 5-20 characters long with no spaces.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send({ 
        message: 'Password must be 8-30 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    if (!username || !password) {
      return res.status(400).send({ message: "Please enter username and password" });
    }

    const [result] = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
    if (!result.length) {
      return res.status(401).send({ message: "Invalid username or password" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '1h' });
    res.send({ message: "Login successful", token });
  } catch (error) {
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
  
      let user;
      try {
        user = jwt.verify(token, secret);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      if (!user || !user.username) {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      const [checkResult] = await conn.query('SELECT * FROM users WHERE username = ?', user.username);
      if (!checkResult.length) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const [result] = await conn.query('SELECT * FROM users');
      res.json({ users: result });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
module.exports = {  login, auth, register };
