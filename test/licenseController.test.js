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
    // Mock the queries in the correct order
    getConnection.mockReturnValueOnce({
      query: jest.fn()
        .mockResolvedValueOnce([[{ id: 18 }], []]) // Mock province check: valid province ID
        .mockResolvedValueOnce([[], []]) // Mock license check: no existing license number
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Mock insert: successful insert
    });
  
    const response = await request(app)
      .post('/api/addLicense')
      .send({
        first_name: 'John',        
        last_name: 'Doe',          
        license_number: 'ABC123',  
        province_id: 18,            
      });
  
    expect(response.status).toBe(200); // Check for 200 status code
    expect(response.body).toEqual({
      message: 'License plate inserted successfully',
      result: { affectedRows: 1 },
    });
  });
  

  test('should return 400 if first name is invalid', async () => {
    const response = await request(app)
      .post('/api/addLicense')
      .send({
        first_name: 'J', // Invalid first name
        last_name: 'Doe',
        license_number: 'ABC123',
        province_id: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'First Name must be alphanumeric and between 2-20 characters long with no spaces.' });
  });

  test('should update a license plate successfully', async () => {
    // Mock existing license plate
    const mockExistingLicense = [
      { id: 1, first_name: 'John', last_name: 'Doe', license_number: 'ABC123', province_id: 1 }
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
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'License plate not found' });
  });

  test('should return 400 if the province ID is invalid', async () => {
    // Mock existing license plate
    const mockExistingLicense = [
      { id: 1, first_name: 'John', last_name: 'Doe', license_number: 'ABC123', province_id: 1 }
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
    const mockQuery = jest.fn();
  
    // Mock the connection and the query function
    getConnection.mockReturnValueOnce({
      query: mockQuery
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Mock successful access history delete
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Mock successful license plate delete
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Mock successful transaction commit
    });
  
    const response = await request(app)
      .delete('/api/deleteLicense/1') // ID of the license plate to delete
      .expect(200);
  
    expect(response.body).toEqual({ message: 'License plate and related access history deleted successfully' });
  
    // Update the expectations to match the actual order of calls
    expect(mockQuery).toHaveBeenCalledWith('START TRANSACTION');
    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM access_history WHERE license_id = ?', '1');
    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM license_plate WHERE id = ?', '1');
    expect(mockQuery).toHaveBeenCalledWith('COMMIT');
  });
  

  test('should return 404 if the license plate to delete does not exist', async () => {
    // Mock the connection and the query function
    const mockQuery = jest.fn();
  
    getConnection.mockReturnValueOnce({
      query: mockQuery
        .mockResolvedValueOnce([{ affectedRows: 0 }]) // Mock delete where no rows are affected
    });
  
    const response = await request(app)
      .delete('/api/deleteLicense/999') // ID that does not exist
      .expect(404);
  
    expect(response.body).toEqual({ message: 'License plate not found' });
    
    // Ensure that the correct query was called
    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM license_plate WHERE id = ?', '999');
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
          province_id: 1,
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
      province_id: 1,
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
          province_id: 1,
          province: 'กรุงเทพมหานคร',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          license_number: 'XYZ789',
          province_id: 2,
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
        province_id: 1,
        province: 'กรุงเทพมหานคร',
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        license_number: 'XYZ789',
        province_id: 2,
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
