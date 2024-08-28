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

    getConnection.mockReturnValueOnce({
        query: jest.fn().mockResolvedValue([[
          {    
              no_of_cars: 5,
              no_of_empty: 3,
              detection_date: '2024-08-23 16:59',
              image_source: 'path/fileImage'}
        ], []]),
      });
      
    const response = await request(app)
      .post('/api/addDetect') // Assuming this is the route
      .send({
        no_of_cars: 5,
        no_of_empty: 3,
        detection_date: '2024-08-23 16:59',
        image_source: 'path/fileImage'
    })
    .expect('Content-Type', /json/)
    .expect(200);

    expect(response.body).toEqual({
      message: 'Detection data inserted successfully',
      result: [
        {
          detection_date: '2024-08-23 16:59',
          image_source: 'path/fileImage',
          no_of_cars: 5,
          no_of_empty: 3,
        },
      ],
    });    
  });

  test('should return 400 if required fields are missing', async () => {

    getConnection.mockReturnValueOnce({
      query: jest.fn().mockResolvedValue([[
        {    
            no_of_cars: 5,
            // Missing no_of_empty, detection_date, and image_source
        }
      ], []]),
    });

    const response = await request(app)
      .post('/api/addDetect')
      .send({
        no_of_cars: 5,
        // Missing no_of_empty, detection_date, and image_source
      })
      .expect('Content-Type', /json/)
      .expect(400);

      expect(response.body).toEqual({ message: 'Missing required fields' });
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
   
    getConnection().query.mockResolvedValueOnce([mockDetectionData]);
   
    const response = await request(app)
      .get('/api/detection') // Ensure this matches your route
      .expect('Content-Type', /json/)
      .expect(200);
   
    expect(response.body).toEqual(mockDetectionData);
   });
   
   test('should return 500 if there is a server error', async () => {
    getConnection().query.mockRejectedValueOnce(new Error('Query error'));

    const response = await request(app)
      .get('/api/detection')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});
