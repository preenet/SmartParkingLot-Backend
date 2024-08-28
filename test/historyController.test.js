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
    query: jest.fn(), // Mock the query method
    execute: jest.fn(), // Mock the execute method (if needed)
  });
});

describe('Integration tests with MySQL', () => {

  test('should insert access history and return success message', async () => {

    getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[
          {    
            license_id: 1,
            access_date: '2024-08-23 16:59',
            access_type: 1,
            image_source: 'path/fileImage'
          }
        ], []]),
      });

    const response = await request(app)
      .post('/api/addHistory') // Assuming this is the route
      .send({
        license_id: 1,
        access_date: '2024-08-23 16:59',
        access_type: 1,
        image_source: 'path/fileImage'
      })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Access History inserted successfully',
      result: [{ 
        license_id: 1,
        access_date: '2024-08-23 16:59',
        access_type: 1,
        image_source: 'path/fileImage'
       }]
    });
  });

  test('should return 500 if there is an error during insertion', async () => {
    // Mock the query method to throw an error
    getConnection().query.mockRejectedValueOnce(new Error('Database Error'));

    const response = await request(app)
      .post('/api/addHistory')
      .send({
        license_id: 1,
        access_date: '2024-08-23 16:59',
        access_type: 'entry',
        image_source: 'path/fileImage'
      })
      .expect(500);

    expect(response.body).toEqual({ message: 'Internal server error' });
  });

  test('should return access history data from the database', async () => {
    const mockHistoryData = [
      {
        license_id: 1,
        access_date: '2024-08-23 16:59',
        access_type: 'entry',
        image_source: 'path/fileImage'
      }
    ];

    // Mock the response from the database for a select operation
    getConnection().query.mockResolvedValueOnce([mockHistoryData]);

    const response = await request(app)
      .get('/api/history') // Assuming this is the route
      .expect(200);

    expect(response.body).toEqual(mockHistoryData);
  });

  test('should return 500 if there is an error fetching access history', async () => {
    // Mock the query method to throw an error
    getConnection().query.mockRejectedValueOnce(new Error('Database Error'));

    const response = await request(app)
      .get('/api/history')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});
