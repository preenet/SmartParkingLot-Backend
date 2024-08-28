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

  test('should insert a new license plate successfully', async () => {
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([[{ id: 1 }], []]) // Mock province check
        .mockResolvedValueOnce([[], []]) // Mock license check
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Mock insert
    });

    const response = await request(app)
      .post('/api/addLicense')
      .send({
        first_name: 'John',
        last_name: 'Doe',
        license_number: 'ABC123',
        province_id: 18,
      })
      .expect(200);

    expect(response.body).toEqual({
      message: 'License plate inserted successfully',
      result: { affectedRows: 1 },
    });
  });


  test('should update a license plate successfully', async () => {
    // Mock existing license plate
    const mockExistingLicense = [
      { id: 1, first_name: 'John', last_name: 'Doe', license_number: 'ABC123', province_id: 18 }
    ];
  
    // Mock valid province check response
    const mockValidProvince = [
      { id: 20, name: 'Some Province' }
    ];
  
    // Mock province check and update query
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([mockExistingLicense, []]) // Mock the existing license plate check
        .mockResolvedValueOnce([mockValidProvince, []]) // Mock the valid province check
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Mock successful update
    });
  
    const response = await request(app)
      .put('/api/editLicense/1')
      .send({
        first_name: 'Johnathan',
        last_name: 'Doe',
        license_number: 'XYZ789',
        province_id: 20
      });
  
    // console.log('Response:', response.body);
  
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'License plate updated successfully',
      result: { affectedRows: 1 }
    });
  });
  
  
  test('should return 404 if the license plate to update does not exist', async () => {
    // Mock license plate not found
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([[], []]) // Mock the non-existing license plate check
    });

    const response = await request(app)
      .put('/api/editLicense/999') // ID that does not exist
      .send({
        first_name: 'Johnathan',
        last_name: 'Doe',
        license_number: 'XYZ789',
        province_id: 20
      })

    //   console.log('Response:', response.body);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'License plate not found' });
  });

  test('should return 400 if the province ID is invalid', async () => {
    // Mock existing license plate
    const mockExistingLicense = [
      { id: 1, first_name: 'John', last_name: 'Doe', license_number: 'ABC123', province_id: 18 }
    ];

    // Mock province check as invalid
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([mockExistingLicense, []]) // Mock the existing license plate check
        .mockResolvedValueOnce([[], []]) // Mock the invalid province check
    });

    const response = await request(app)
      .put('/api/editLicense/1')
      .send({
        first_name: 'Johnathan',
        last_name: 'Doe',
        license_number: 'XYZ789',
        province_id: 999 // Invalid province ID
      })
      .expect(400);

    expect(response.body).toEqual({ message: 'Invalid province ID' });
  });

  test('should delete a license plate successfully', async () => {
    // Mock successful delete operation
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Mock successful delete
    });

    const response = await request(app)
      .delete('/api/deleteLicense/1') // ID of the license plate to delete
      .expect(200);

    expect(response.body).toEqual({ message: 'License plate deleted successfully' });
  });

  test('should return 404 if the license plate to delete does not exist', async () => {
    // Mock license plate not found
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([{ affectedRows: 0 }, []]) // Mock delete where no rows are affected
    });

    const response = await request(app)
      .delete('/api/deleteLicense/999') // ID that does not exist
      .expect(404);

    expect(response.body).toEqual({ message: 'License plate not found' });
  });

  test('should return 500 if there is a database error', async () => {
    // Mock a database error
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockRejectedValueOnce(new Error('Database error')) // Mock an error
    });
  
    const response = await request(app)
      .delete('/api/deleteLicense/1') // Correctly include an ID
      .expect(500);
  
    expect(response.body).toEqual({ error: 'Internal server error' });
  });
  

  test('should get a license plate by ID successfully', async () => {
    // Mock the database response for an existing license plate
    getConnection.mockReturnValueOnce({
      query: jest.fn().mockResolvedValue([[
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          license_number: 'ABC123',
          province_id: 18,
          province: 'กรุงเทพมหานคร',
        }
      ], []]),
    });

    const response = await request(app)
      .get('/api/licensePlates/1')
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      license_number: 'ABC123',
      province_id: 18,
      province: 'กรุงเทพมหานคร',
    });
  });

  test('should return 404 if license plate is not found', async () => {
    // Mock the database response for a non-existent license plate
    getConnection.mockReturnValueOnce({
      query: jest.fn().mockResolvedValue([[], []]),
    });

    const response = await request(app)
      .get('/api/licensePlates/999')
      .expect(404);

    expect(response.body).toEqual({
      message: 'License plate not found',
    });
  });

  test('should get all license plates successfully', async () => {
    // Mock the database response for multiple license plates
    getConnection.mockReturnValueOnce({
      query: jest.fn().mockResolvedValue([[
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          license_number: 'ABC123',
          province_id: 18,
          province: 'กรุงเทพมหานคร',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          license_number: 'XYZ789',
          province_id: 22,
          province: 'เชียงใหม่',
        }
      ], []]),
    });

    const response = await request(app)
      .get('/api/licensePlates')
      .expect(200);

    expect(response.body).toEqual([
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        license_number: 'ABC123',
        province_id: 18,
        province: 'กรุงเทพมหานคร',
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        license_number: 'XYZ789',
        province_id: 22,
        province: 'เชียงใหม่',
      }
    ]);
  });

  test('should return 500 if there is a database error while getting all license plates', async () => {
    // Mock a database error
    getConnection.mockReturnValueOnce({
      query: jest.fn().mockRejectedValueOnce(new Error('Database error')), // Mock error
    });

    const response = await request(app)
      .get('/api/licensePlates')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });

});
