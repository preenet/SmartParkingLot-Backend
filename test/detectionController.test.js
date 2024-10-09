const request = require('supertest');
const app = require('../index'); // Import app instance
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

  test('should insert detection data and return success message', async () => {

    // Mock the connection to return a resolved value after insertion
    getConnection().query.mockResolvedValueOnce([{}]);

    const response = await request(app)
      .post('/api/addDetect') // Assuming this is the route
      .send([ // Send an array as per the addDetect logic
        {
          no_of_cars: 5,
          no_of_empty: 3,
          detection_date: '2024-08-23 16:59',
          image_source: 'path/fileImage'
        }
      ])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      message: 'Detection data inserted successfully',
    });
  });

  test('should return 400 if request body is not an array', async () => {
    const response = await request(app)
      .post('/api/addDetect')
      .send({ // Sending a single object, not an array
        no_of_cars: 5,
        no_of_empty: 3,
        detection_date: '2024-08-23 16:59',
        image_source: 'path/fileImage'
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ message: 'Request body must be an array' });
  });

  test('should return 400 if any required fields are missing in the array', async () => {
    const response = await request(app)
      .post('/api/addDetect')
      .send([ // Send an array, but one of the objects is missing required fields
        {
          no_of_cars: 5,
          no_of_empty: 3,
          // Missing detection_date and image_source
        }
      ])
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({ message: 'Missing required fields in one of the objects' });
  });

  test('should return detection data from the database', async () => {
    const mockDetectionData = [
      {    
        no_of_cars: 5,
        no_of_empty: 3,
        detection_date: '2024-08-23 16:59',
        image_source: 'path/fileImage',
      }
    ];

    // Mock the connection to return the detection data
    getConnection().query.mockResolvedValueOnce([mockDetectionData]);

    const response = await request(app)
      .get('/api/detection') // Ensure this matches your route
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual(mockDetectionData);
  });

  test('should return 500 if there is a server error', async () => {
    // Mock the connection to throw an error
    getConnection().query.mockRejectedValueOnce(new Error('Query error'));

    const response = await request(app)
      .get('/api/detection')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});
