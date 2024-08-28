const request = require('supertest');
const app = require('../index'); // Assuming your Express app is exported from index.js
const { getConnection } = require('../services/dataService');

// Mock the dataService module to use the mock implementation
jest.mock('../services/dataService', () => ({
    initDatabase: jest.fn(),
    getConnection: jest.fn(),
  }));

  beforeEach(() => {
    jest.resetAllMocks();
    getConnection.mockReturnValue({
      query: jest.fn(),
    });
  });

  describe('Integration tests with MySQL', () => {

    test('should get all provinces successfully', async () => {
        const mockProvinces = [
          { id: 1, name: 'Province1' },
          { id: 2, name: 'Province2' }
        ];
    
        getConnection.mockReturnValueOnce({
          query: jest.fn().mockResolvedValueOnce([mockProvinces])
        });
    
        const response = await request(app)
          .get('/api/province')
          .expect(200);
    
        expect(response.body).toEqual({ result: mockProvinces });
      });

      test('should return 500 if there is a database error', async () => {
        getConnection.mockReturnValueOnce({
          query: jest.fn().mockRejectedValueOnce(new Error('Database error'))
        });
    
        const response = await request(app)
          .get('/api/province')
          .expect(500);
    
        expect(response.body).toEqual({ error: 'Internal server error' });
      });

      test('should return 500 if the connection is not initialized', async () => {
        getConnection.mockReturnValueOnce(null);
    
        const response = await request(app)
          .get('/api/province')
          .expect(500);
    
        expect(response.body).toEqual({ error: 'Internal server error' });
      });
  });