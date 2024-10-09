const request = require('supertest');
const app = require('../index'); // Import app instance
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../services/dataService');
const secret = process.env.SECRET || "mysecret";

// Mock the dataService module to use the mock implementation
jest.mock('../services/dataService', () => ({
  initDatabase: jest.fn(),
  queryDataAndExportToCSV: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

beforeEach(() => {
  jest.resetAllMocks();
  getConnection.mockReturnValue({
    query: jest.fn(), // Mock the query method
    execute: jest.fn(), // Mock the execute method (if needed)
  });
});

describe('Integration tests with MySQL', () => {
  describe('Login Tests', () => {
    test('should return 200 and a token for successful login', async () => {
      bcrypt.compare.mockResolvedValue(true); // Password matches
      jwt.sign.mockReturnValue('mockedToken');

      getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[
          { username: 'test01', password: await bcrypt.hash('Password@123', 10) }
        ], []]),
      });

      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test01', password: 'Password@123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe("Login successful");
    });

    test('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: '', password: 'Password@123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Username must be alphanumeric and between 5-20 characters long with no spaces.' });
    });

    test('should return 400 if username format is invalid', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'ab', password: 'Password@123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Username must be alphanumeric and between 5-20 characters long with no spaces.' });
    });

    test('should return 400 if password format is invalid', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test01', password: '123456' }); // Missing uppercase, special character

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        message: 'Password must be 8-30 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    });

    test('should return 401 if user is not found', async () => {
      getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[], []]),
      });

      const response = await request(app)
        .post('/api/login')
        .send({ username: 'nonexistent', password: 'Password@123' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid username or password' });
    });

    test('should return 401 if password does not match', async () => {
      bcrypt.compare.mockResolvedValue(false); // Simulate password mismatch

      getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[
          { username: 'test01', password: await bcrypt.hash('Password@123', 10) }
        ], []]),
      });

      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test01', password: 'Password@1234' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid username or password' });
    });

    test('should return 500 if there is a server error', async () => {
      getConnection.mockReturnValueOnce({
        query: jest.fn().mockRejectedValue(new Error('Query error')),
      });

      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test01', password: 'Password@123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'An error occurred while logging in' });
    });
  });

  // Tests for the auth middleware
  describe('Auth middleware tests', () => {
    test('should return 401 if authorization header is missing', async () => {
      const response = await request(app)
        .get('/api/auth') // Adjust the endpoint to match your API
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({ error: 'Authorization header missing' });
    });

    test('should return 401 if token is missing from authorization header', async () => {
      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', 'Bearer ')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({ error: 'Token missing' });
    });

    test('should return 401 if token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', 'Bearer invalidToken')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({ error: 'Invalid token' });
    });

    test('should return 404 if user is not found', async () => {
      jwt.verify.mockReturnValue({ username: 'test01' });

      getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[], []]), // User not found
      });

      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', 'Bearer validToken')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toEqual({ error: 'User not found' });
    });

    test('should return 200 and user list on successful authentication', async () => {
      jwt.verify.mockReturnValue({ username: 'test01' });

      getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[{ username: 'test01' }], []]), // Return a single user object within an array
      });

      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', 'Bearer validToken')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ users: [{ username: 'test01' }] }); // Expect users to be an array
    });

    test('should return 500 if there is a server error', async () => {
      jwt.verify.mockReturnValue({ username: 'test01' });

      getConnection.mockReturnValueOnce({
        query: jest.fn().mockRejectedValue(new Error('Query error')),
      });

      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', 'Bearer validToken')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
});
