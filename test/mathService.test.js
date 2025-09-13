const request = require('supertest');
const app = require('../server'); // Assuming server.js exports the Express app

// Test cases for services/mathService.js contract
describe('Math Service API Tests (services/mathService.js contract)', () => {
  // Test cases for /api/math/add
  describe('POST /api/math/add', () => {
    test('ADD_001: Add two positive integers', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 5, b: 3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'addition',
        operands: { a: 5, b: 3 },
        result: 8,
      });
    });

    test('ADD_002: Add a positive and a negative integer', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 10, b: -7 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'addition',
        operands: { a: 10, b: -7 },
        result: 3,
      });
    });

    test('ADD_003: Add two negative integers', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: -5, b: -3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'addition',
        operands: { a: -5, b: -3 },
        result: -8,
      });
    });

    test('ADD_004: Add with zero', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 7, b: 0 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'addition',
        operands: { a: 7, b: 0 },
        result: 7,
      });
    });

    test('ADD_005: Add two decimal numbers', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 2.5, b: 3.7 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'addition',
        operands: { a: 2.5, b: 3.7 },
        result: 6.2,
      });
    });

    test('ADD_006: Add with one parameter as non-number (string)', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 'hello', b: 3 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });

    test('ADD_007: Add with one parameter as non-number (boolean)', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 5, b: true });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });

    test('ADD_008: Add with one parameter missing (a)', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ b: 3 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });

    test('ADD_009: Add with one parameter missing (b)', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 5 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });

    test('ADD_010: Add with empty request body', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });

    test('ADD_011: Add with large numbers (within safe integer limits)', async () => {
      const response = await request(app)
        .post('/api/math/add')
        .send({ a: 9007199254740990, b: 1 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'addition',
        operands: { a: 9007199254740990, b: 1 },
        result: 9007199254740991,
      });
    });
  });

  // Test cases for /api/math/subtract
  describe('POST /api/math/subtract', () => {
    test('SUB_001: Subtract two positive integers', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: 10, b: 4 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'subtraction',
        operands: { a: 10, b: 4 },
        result: 6,
      });
    });

    test('SUB_002: Subtract a smaller number from a larger number (negative result)', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: 4, b: 10 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'subtraction',
        operands: { a: 4, b: 10 },
        result: -6,
      });
    });

    test('SUB_003: Subtract with negative numbers', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: -5, b: -3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'subtraction',
        operands: { a: -5, b: -3 },
        result: -2,
      });
    });

    test('SUB_004: Subtract with zero', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: 7, b: 0 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'subtraction',
        operands: { a: 7, b: 0 },
        result: 7,
      });
    });

    test('SUB_005: Subtract a number from zero', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: 0, b: 5 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'subtraction',
        operands: { a: 0, b: 5 },
        result: -5,
      });
    });

    test('SUB_006: Subtract with decimal numbers', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: 5.5, b: 2.3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'subtraction',
        operands: { a: 5.5, b: 2.3 },
        result: 3.2,
      });
    });

    test('SUB_007: Subtract with one parameter as non-number (null)', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ a: 10, b: null });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });

    test('SUB_008: Subtract with missing "a" parameter', async () => {
      const response = await request(app)
        .post('/api/math/subtract')
        .send({ b: 5 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });
  });

  // Test cases for /api/math/multiply
  describe('POST /api/math/multiply', () => {
    test('MUL_001: Multiply two positive integers', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ a: 5, b: 3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'multiplication',
        operands: { a: 5, b: 3 },
        result: 15,
      });
    });

    test('MUL_002: Multiply with a negative number', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ a: 5, b: -3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'multiplication',
        operands: { a: 5, b: -3 },
        result: -15,
      });
    });

    test('MUL_003: Multiply two negative numbers', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ a: -5, b: -3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'multiplication',
        operands: { a: -5, b: -3 },
        result: 15,
      });
    });

    test('MUL_004: Multiply with zero', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ a: 7, b: 0 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'multiplication',
        operands: { a: 7, b: 0 },
        result: 0,
      });
    });

    test('MUL_005: Multiply with one', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ a: 7, b: 1 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'multiplication',
        operands: { a: 7, b: 1 },
        result: 7,
      });
    });

    test('MUL_006: Multiply with decimal numbers', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ a: 2.5, b: 1.5 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'multiplication',
        operands: { a: 2.5, b: 1.5 },
        result: 3.75,
      });
    });

    test('MUL_007: Multiply with "a" as undefined', async () => {
      const response = await request(app)
        .post('/api/math/multiply')
        .send({ b: 5 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });
  });

  // Test cases for /api/math/divide
  describe('POST /api/math/divide', () => {
    test('DIV_001: Divide two positive integers', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: 10, b: 2 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'division',
        operands: { a: 10, b: 2 },
        result: 5,
      });
    });

    test('DIV_002: Divide with negative numbers', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: -10, b: 2 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'division',
        operands: { a: -10, b: 2 },
        result: -5,
      });
    });

    test('DIV_003: Divide by a negative number', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: 10, b: -2 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'division',
        operands: { a: 10, b: -2 },
        result: -5,
      });
    });

    test('DIV_004: Divide two negative numbers', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: -10, b: -2 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'division',
        operands: { a: -10, b: -2 },
        result: 5,
      });
    });

    test('DIV_005: Divide zero by a non-zero number', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: 0, b: 5 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'division',
        operands: { a: 0, b: 5 },
        result: 0,
      });
    });

    test('DIV_006: Divide by zero', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: 10, b: 0 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Lỗi chia cho 0',
        message: 'Không thể chia cho 0',
      });
    });

    test('DIV_007: Divide zero by zero', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: 0, b: 0 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Lỗi chia cho 0',
        message: 'Không thể chia cho 0',
      });
    });

    test('DIV_008: Divide with decimal numbers', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: 7.5, b: 2.5 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'division',
        operands: { a: 7.5, b: 2.5 },
        result: 3,
      });
    });

    test('DIV_009: Divide with non-number "a" parameter (object)', async () => {
      const response = await request(app)
        .post('/api/math/divide')
        .send({ a: { value: 10 }, b: 2 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số',
      });
    });
  });

  // Test cases for /api/math/power
  describe('POST /api/math/power', () => {
    test('POW_001: Power with positive base and exponent', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 2, exponent: 3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: 2, exponent: 3 },
        result: 8,
      });
    });

    test('POW_002: Power with negative base and even exponent', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: -2, exponent: 2 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: -2, exponent: 2 },
        result: 4,
      });
    });

    test('POW_003: Power with negative base and odd exponent', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: -2, exponent: 3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: -2, exponent: 3 },
        result: -8,
      });
    });

    test('POW_004: Power with positive base and zero exponent', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 5, exponent: 0 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: 5, exponent: 0 },
        result: 1,
      });
    });

    test('POW_005: Power with zero base and positive exponent', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 0, exponent: 5 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: 0, exponent: 5 },
        result: 0,
      });
    });

    test('POW_006: Power with zero base and zero exponent (0^0)', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 0, exponent: 0 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: 0, exponent: 0 },
        result: 1,
      });
    });

    test('POW_007: Power with positive base and negative exponent', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 2, exponent: -3 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: 2, exponent: -3 },
        result: 0.125,
      });
    });

    test('POW_008: Power with fractional exponent (square root)', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 9, exponent: 0.5 });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'power',
        operands: { base: 9, exponent: 0.5 },
        result: 3,
      });
    });

    test('POW_009: Power with "base" as non-number (array)', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: [2], exponent: 3 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả base và exponent phải là số',
      });
    });

    test('POW_010: Power with missing "exponent" parameter', async () => {
      const response = await request(app)
        .post('/api/math/power')
        .send({ base: 2 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'Cả base và exponent phải là số',
      });
    });
  });

  // Test cases for /api/math/factorial/:n
  describe('GET /api/math/factorial/:n', () => {
    test('FAC_001: Factorial of 0', async () => {
      const response = await request(app).get('/api/math/factorial/0');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'factorial',
        operand: 0,
        result: 1,
      });
    });

    test('FAC_002: Factorial of 1', async () => {
      const response = await request(app).get('/api/math/factorial/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'factorial',
        operand: 1,
        result: 1,
      });
    });

    test('FAC_003: Factorial of a positive integer (5)', async () => {
      const response = await request(app).get('/api/math/factorial/5');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'factorial',
        operand: 5,
        result: 120,
      });
    });

    test('FAC_004: Factorial of a larger positive integer (10)', async () => {
      const response = await request(app).get('/api/math/factorial/10');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'factorial',
        operand: 10,
        result: 3628800,
      });
    });

    test('FAC_005: Factorial of a negative number', async () => {
      const response = await request(app).get('/api/math/factorial/-5');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm',
      });
    });

    test('FAC_006: Factorial with non-integer input (decimal)', async () => {
      const response = await request(app).get('/api/math/factorial/5.5');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm',
      });
    });

    test('FAC_007: Factorial with non-numeric input (string)', async () => {
      const response = await request(app).get('/api/math/factorial/abc');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm',
      });
    });

    test('FAC_008: Factorial of maximum allowed number (170)', async () => {
      const response = await request(app).get('/api/math/factorial/170');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'factorial',
        operand: 170,
        result: '7.257415615307994e+306',
      });
    });

    test('FAC_009: Factorial of a number exceeding limit (171)', async () => {
      const response = await request(app).get('/api/math/factorial/171');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Số quá lớn',
        message: 'n không được vượt quá 170 để tránh tràn số',
      });
    });
  });

  // Test cases for /api/math/fibonacci/:n
  describe('GET /api/math/fibonacci/:n', () => {
    test('FIB_001: Fibonacci sequence for n=0', async () => {
      const response = await request(app).get('/api/math/fibonacci/0');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'fibonacci',
        operand: 0,
        result: [0],
        count: 1,
      });
    });

    test('FIB_002: Fibonacci sequence for n=1', async () => {
      const response = await request(app).get('/api/math/fibonacci/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'fibonacci',
        operand: 1,
        result: [0, 1],
        count: 2,
      });
    });

    test('FIB_003: Fibonacci sequence for n=5', async () => {
      const response = await request(app).get('/api/math/fibonacci/5');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'fibonacci',
        operand: 5,
        result: [0, 1, 1, 2, 3, 5],
        count: 6,
      });
    });

    test('FIB_004: Fibonacci sequence for n=10', async () => {
      const response = await request(app).get('/api/math/fibonacci/10');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'fibonacci',
        operand: 10,
        result: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
        count: 11,
      });
    });

    test('FIB_005: Fibonacci sequence for a negative number', async () => {
      const response = await request(app).get('/api/math/fibonacci/-5');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm',
      });
    });

    test('FIB_006: Fibonacci sequence with non-numeric input (string)', async () => {
      const response = await request(app).get('/api/math/fibonacci/xyz');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm',
      });
    });

    test('FIB_007: Fibonacci sequence with decimal input', async () => {
      const response = await request(app).get('/api/math/fibonacci/5.9');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm',
      });
    });

    test('FIB_008: Fibonacci sequence for maximum allowed number (1000)', async () => {
      const response = await request(app).get('/api/math/fibonacci/1000');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('operation', 'fibonacci');
      expect(response.body).toHaveProperty('operand', 1000);
      expect(response.body).toHaveProperty('count', 1001);
      expect(response.body.result).toBe("ARRAY_OF_1001_ELEMENTS_ENDING_WITH_INFINITY_DUE_TO_OVERFLOW");
    });

    test('FIB_009: Fibonacci sequence for a number exceeding limit (1001)', async () => {
      const response = await request(app).get('/api/math/fibonacci/1001');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Số quá lớn',
        message: 'n không được vượt quá 1000 để tránh timeout',
      });
    });

    test('FIB_010: Fibonacci sequence for a number causing overflow to Infinity (e.g., n=1476 in JS)', async () => {
      const response = await request(app).get('/api/math/fibonacci/1476');
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Số quá lớn',
        message: 'n không được vượt quá 1000 để tránh timeout',
      });
    });
  });

  // General API tests that might apply to mathService.js router if mounted
  describe('General API Errors (mathService.js context)', () => {
    test('GENERAL_001: Accessing an undefined POST route', async () => {
      const response = await request(app)
        .post('/api/math/unknown')
        .send({});
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Not Found' });
    });

    test('GENERAL_002: Accessing an undefined GET route', async () => {
      const response = await request(app).get('/api/math/unknown');
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Not Found' });
    });

    test('GENERAL_003: Using GET method on a POST-only route (e.g., /add)', async () => {
      const response = await request(app).get('/api/math/add');
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Not Found' });
    });

    test('GENERAL_004: Using POST method on a GET-only route (e.g., /factorial)', async () => {
      const response = await request(app)
        .post('/api/math/factorial/5')
        .send({});
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Not Found' });
    });
  });
});

// Test cases for services/stringService.js contract
describe('String Service API Tests (services/stringService.js contract)', () => {
  // Test cases for /api/string/reverse
  describe('POST /api/string/reverse', () => {
    test('reverse_001: Valid standard string', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: 'hello' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'reverse',
        input: 'hello',
        result: 'olleh',
      });
    });

    test('reverse_002: Valid string with spaces', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: 'hello world' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'reverse',
        input: 'hello world',
        result: 'dlrow olleh',
      });
    });

    test('reverse_003: Valid empty string', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: '' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'reverse',
        input: '',
        result: '',
      });
    });

    test('reverse_004: Valid string with numbers and special characters', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: '123!@#abc' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'reverse',
        input: '123!@#abc',
        result: 'cba#!@321',
      });
    });

    test('reverse_005: Valid string with mixed case', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: 'HeLlO' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'reverse',
        input: 'HeLlO',
        result: 'OlLeH',
      });
    });

    test('reverse_006: Valid string with Unicode characters', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: 'Xin chào thế giới' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'reverse',
        input: 'Xin chào thế giới',
        result: 'iớig ếht oàhc niX',
      });
    });

    test('reverse_007: Invalid input - missing "text" parameter', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });

    test('reverse_008: Invalid input - "text" is null', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: null });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });

    test('reverse_009: Invalid input - "text" is a number', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: 12345 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });

    test('reverse_010: Invalid input - "text" is an object', async () => {
      const response = await request(app)
        .post('/api/string/reverse')
        .send({ text: { value: 'hello' } });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });
  });

  // Test cases for /api/string/uppercase
  describe('POST /api/string/uppercase', () => {
    test('uppercase_001: Valid standard string', async () => {
      const response = await request(app)
        .post('/api/string/uppercase')
        .send({ text: 'hello world' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'uppercase',
        input: 'hello world',
        result: 'HELLO WORLD',
      });
    });

    test('uppercase_002: Valid mixed case string', async () => {
      const response = await request(app)
        .post('/api/string/uppercase')
        .send({ text: 'HeLlO WoRlD' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'uppercase',
        input: 'HeLlO WoRlD',
        result: 'HELLO WORLD',
      });
    });

    test('uppercase_003: Valid empty string', async () => {
      const response = await request(app)
        .post('/api/string/uppercase')
        .send({ text: '' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'uppercase',
        input: '',
        result: '',
      });
    });

    test('uppercase_004: Valid string with numbers and special characters', async () => {
      const response = await request(app)
        .post('/api/string/uppercase')
        .send({ text: 'text123!@#' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'uppercase',
        input: 'text123!@#',
        result: 'TEXT123!@#',
      });
    });

    test('uppercase_005: Valid string with Unicode characters', async () => {
      const response = await request(app)
        .post('/api/string/uppercase')
        .send({ text: 'xin chào' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'uppercase',
        input: 'xin chào',
        result: 'XIN CHÀO',
      });
    });

    test('uppercase_006: Invalid input - "text" is undefined', async () => {
      const response = await request(app)
        .post('/api/string/uppercase')
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });
  });

  // Test cases for /api/string/lowercase
  describe('POST /api/string/lowercase', () => {
    test('lowercase_001: Valid standard string', async () => {
      const response = await request(app)
        .post('/api/string/lowercase')
        .send({ text: 'HELLO WORLD' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'lowercase',
        input: 'HELLO WORLD',
        result: 'hello world',
      });
    });

    test('lowercase_002: Valid mixed case string', async () => {
      const response = await request(app)
        .post('/api/string/lowercase')
        .send({ text: 'HeLlO WoRlD' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'lowercase',
        input: 'HeLlO WoRlD',
        result: 'hello world',
      });
    });

    test('lowercase_003: Valid empty string', async () => {
      const response = await request(app)
        .post('/api/string/lowercase')
        .send({ text: '' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'lowercase',
        input: '',
        result: '',
      });
    });

    test('lowercase_004: Valid string with numbers and special characters', async () => {
      const response = await request(app)
        .post('/api/string/lowercase')
        .send({ text: 'TEXT123!@#' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'lowercase',
        input: 'TEXT123!@#',
        result: 'text123!@#',
      });
    });

    test('lowercase_005: Valid string with Unicode characters', async () => {
      const response = await request(app)
        .post('/api/string/lowercase')
        .send({ text: 'XIN CHÀO' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'lowercase',
        input: 'XIN CHÀO',
        result: 'xin chào',
      });
    });

    test('lowercase_006: Invalid input - "text" is a boolean', async () => {
      const response = await request(app)
        .post('/api/string/lowercase')
        .send({ text: true });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });
  });

  // Test cases for /api/string/word-count
  describe('POST /api/string/word-count', () => {
    test('wordcount_001: Valid standard sentence', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: 'Hello world, this is a test.' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: 'Hello world, this is a test.',
        result: {
          wordCount: 6,
          words: ['Hello', 'world,', 'this', 'is', 'a', 'test.'],
        },
      });
    });

    test('wordcount_002: Valid single word', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: 'Word' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: 'Word',
        result: { wordCount: 1, words: ['Word'] },
      });
    });

    test('wordcount_003: Valid empty string', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: '' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: '',
        result: { wordCount: 0, words: [] },
      });
    });

    test('wordcount_004: Valid string with leading/trailing/multiple spaces', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: '  Hello   world   ' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: '  Hello   world   ',
        result: { wordCount: 2, words: ['Hello', 'world'] },
      });
    });

    test('wordcount_005: Valid string with only spaces', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: '     ' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: '     ',
        result: { wordCount: 0, words: [] },
      });
    });

    test('wordcount_006: Valid string with numbers as words', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: '123 test 456' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: '123 test 456',
        result: { wordCount: 3, words: ['123', 'test', '456'] },
      });
    });

    test('wordcount_007: Valid string with Unicode characters', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: 'Xin chào thế giới!' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'word-count',
        input: 'Xin chào thế giới!',
        result: { wordCount: 4, words: ['Xin', 'chào', 'thế', 'giới!'] },
      });
    });

    test('wordcount_008: Invalid input - "text" is an array', async () => {
      const response = await request(app)
        .post('/api/string/word-count')
        .send({ text: ['hello', 'world'] });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });
  });

  // Test cases for /api/string/char-count
  describe('POST /api/string/char-count', () => {
    test('charcount_001: Valid standard string', async () => {
      const response = await request(app)
        .post('/api/string/char-count')
        .send({ text: 'hello' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'char-count',
        input: 'hello',
        result: {
          totalCharacters: 5,
          charactersWithoutSpaces: 5,
          spaces: 0,
        },
      });
    });

    test('charcount_002: Valid string with spaces', async () => {
      const response = await request(app)
        .post('/api/string/char-count')
        .send({ text: 'hello world' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'char-count',
        input: 'hello world',
        result: {
          totalCharacters: 11,
          charactersWithoutSpaces: 10,
          spaces: 1,
        },
      });
    });

    test('charcount_003: Valid empty string', async () => {
      const response = await request(app)
        .post('/api/string/char-count')
        .send({ text: '' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'char-count',
        input: '',
        result: {
          totalCharacters: 0,
          charactersWithoutSpaces: 0,
          spaces: 0,
        },
      });
    });

    test('charcount_004: Valid string with only spaces', async () => {
      const response = await request(app)
        .post('/api/string/char-count')
        .send({ text: '   ' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'char-count',
        input: '   ',
        result: {
          totalCharacters: 3,
          charactersWithoutSpaces: 0,
          spaces: 3,
        },
      });
    });

    test('charcount_005: Valid string with Unicode characters', async () => {
      const response = await request(app)
        .post('/api/string/char-count')
        .send({ text: 'Xin chào' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'char-count',
        input: 'Xin chào',
        result: {
          totalCharacters: 8,
          charactersWithoutSpaces: 7,
          spaces: 1,
        },
      });
    });

    test('charcount_006: Invalid input - "text" is a number', async () => {
      const response = await request(app)
        .post('/api/string/char-count')
        .send({ text: 123 });
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });
  });

  // Test cases for /api/string/palindrome
  describe('POST /api/string/palindrome', () => {
    test('palindrome_001: Valid palindrome string', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: 'madam' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: 'madam',
        result: {
          isPalindrome: true,
          cleanedText: 'madam',
          reversedText: 'madam',
        },
      });
    });

    test('palindrome_002: Valid non-palindrome string', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: 'hello' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: 'hello',
        result: {
          isPalindrome: false,
          cleanedText: 'hello',
          reversedText: 'olleh',
        },
      });
    });

    test('palindrome_003: Valid palindrome with spaces and mixed case', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: 'Race car' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: 'Race car',
        result: {
          isPalindrome: true,
          cleanedText: 'racecar',
          reversedText: 'racecar',
        },
      });
    });

    test('palindrome_004: Valid empty string', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: '' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: '',
        result: {
          isPalindrome: true,
          cleanedText: '',
          reversedText: '',
        },
      });
    });

    test('palindrome_005: Valid single character string', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: 'a' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: 'a',
        result: {
          isPalindrome: true,
          cleanedText: 'a',
          reversedText: 'a',
        },
      });
    });

    test('palindrome_006: Valid string with only spaces', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: '   ' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: '   ',
        result: {
          isPalindrome: true,
          cleanedText: '',
          reversedText: '',
        },
      });
    });

    test('palindrome_007: Valid complex palindrome (ignoring spaces/case)', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({ text: 'No lemon, no melon' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        operation: 'palindrome',
        input: 'No lemon, no melon',
        result: {
          isPalindrome: true,
          cleanedText: 'nolemonnomelon',
          reversedText: 'nolemonnomelon',
        },
      });
    });

    test('palindrome_008: Invalid input - "text" is undefined', async () => {
      const response = await request(app)
        .post('/api/string/palindrome')
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi',
      });
    });
  });

  // Test cases for /api/string/remove-spaces
  describe('POST /api/string/remove-spaces', () => {
    test('removespaces_001: Valid string with internal spaces', async () => {
      const response = await request(app)
        .post('/api/string/remove-spaces')
        .send({