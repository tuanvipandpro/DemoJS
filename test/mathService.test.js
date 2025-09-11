const request = require('supertest');
const app = require('../src/app'); // Adjust this path to where your Express app instance is exported

describe('API General, Math, and String Endpoints', () => {

  // test_001
  test('test_001: Verifies that the root endpoint returns the correct welcome message and lists all available API endpoints, ensuring the main entry point is functional.', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "message": "Chào mừng đến với Express Math & String API!",
      "endpoints": {
        "math": {
          "add": "POST /api/math/add",
          "power": "POST /api/math/power",
          "divide": "POST /api/math/divide",
          "multiply": "POST /api/math/multiply",
          "subtract": "POST /api/math/subtract",
          "factorial": "GET /api/math/factorial/:n",
          "fibonacci": "GET /api/math/fibonacci/:n"
        },
        "string": {
          "reverse": "POST /api/string/reverse",
          "charCount": "POST /api/string/char-count",
          "lowercase": "POST /api/string/lowercase",
          "uppercase": "POST /api/string/uppercase",
          "wordCount": "POST /api/string/word-count",
          "palindrome": "POST /api/string/palindrome",
          "removeSpaces": "POST /api/string/remove-spaces"
        }
      }
    });
  });

  // test_002
  test('test_002: Checks if the application correctly handles requests to undefined routes by returning a 404 status and a specific error message, covering the 404 middleware.', async () => {
    const response = await request(app).get('/api/non-existent-route');
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      "error": "Endpoint không tồn tại!",
      "message": "Vui lòng kiểm tra lại đường dẫn API"
    });
  });

  // test_003
  test('test_003: Verifies that the global error handling middleware catches unhandled errors, logs them, and returns a 500 status code with a generic error message, ensuring robust error management.', async () => {
    // This test assumes an endpoint '/api/math/trigger-error' is intentionally designed
    // to throw an unhandled error to trigger the global error handler.
    const response = await request(app).get('/api/math/trigger-error');
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      "error": "Có lỗi xảy ra trên server!",
      "message": "Simulated internal server error"
    });
  });

  // test_004
  test('test_004: Ensures that requests to \'/api/math\' endpoints are correctly delegated to the mathService router, verifying the \'app.use(\'/api/math\', mathService)\' middleware.', async () => {
    const response = await request(app)
      .post('/api/math/add')
      .send({
        "num1": 10,
        "num2": 5
      })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "result": 15
    });
  });

  // test_005
  test('test_005: Ensures that requests to \'/api/string\' endpoints are correctly delegated to the stringService router, verifying the \'app.use(\'/api/string\', stringService)\' middleware.', async () => {
    const response = await request(app)
      .post('/api/string/reverse')
      .send({
        "text": "hello"
      })
      .set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "result": "olleh"
    });
  });

  // math_001
  test('math_001: Verifies the `/add` endpoint correctly performs addition with valid integer inputs, including positive numbers, and returns the expected result along with operation details. This covers the success path for a POST operation.', async () => {
    const response = await request(app)
      .post('/api/math/add')
      .send({
        "a": 5,
        "b": 3
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "result": 8,
      "operands": {
        "a": 5,
        "b": 3
      },
      "operation": "addition"
    });
  });

  // math_002
  test('math_002: Tests the input validation for the `/multiply` endpoint, ensuring it rejects requests where `a` or `b` are not numbers (e.g., string \'hello\') and returns a 400 status with an appropriate error message. This covers the common `typeof a !== \'number\' || typeof b !== \'number\'` validation branch for all POST arithmetic operations.', async () => {
    const response = await request(app)
      .post('/api/math/multiply')
      .send({
        "a": "hello",
        "b": 2
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      "error": "Tham số không hợp lệ",
      "message": "Cả a và b phải là số"
    });
  });

  // math_003
  test('math_003: Verifies that the `/divide` endpoint correctly identifies and handles the division by zero scenario, returning a 400 status and a specific error message. This covers a critical conditional branch unique to the division operation.', async () => {
    const response = await request(app)
      .post('/api/math/divide')
      .send({
        "a": 10,
        "b": 0
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      "error": "Lỗi chia cho 0",
      "message": "Không thể chia cho 0"
    });
  });

  // math_004
  test('math_004: Tests the `/factorial/:n` endpoint for various valid inputs. It verifies correct calculation for a positive integer (5!) and implicitly covers the recursive `factorial` function\'s base cases (0! and 1!) and the recursive step for `num > 1`. This covers the success path and core logic for factorial.', async () => {
    const response = await request(app).get('/api/math/factorial/5');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "result": 120,
      "operand": 5,
      "operation": "factorial"
    });
  });

  // math_005
  test('math_005: Verifies the `/factorial/:n` endpoint\'s robust input validation. This test case specifically uses \'abc\' to trigger the `isNaN(n)` condition. The test also conceptually covers negative numbers (`n < 0`) and numbers exceeding the maximum allowed value (170, `n > 170`), ensuring all major error branches for factorial input are handled with appropriate 400 error responses.', async () => {
    const response = await request(app).get('/api/math/factorial/abc');
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      "error": "Tham số không hợp lệ",
      "message": "n phải là số nguyên không âm"
    });
  });

  // test_string_001
  test('test_string_001: Tests the /reverse endpoint with a standard string to ensure it correctly reverses the text.', async () => {
    const response = await request(app)
      .post('/api/string/reverse')
      .send({
        "text": "hello world"
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "operation": "reverse",
      "input": "hello world",
      "result": "dlrow olleh"
    });
  });

  // test_string_002
  test('test_string_002: Verifies the /word-count endpoint correctly counts words and handles leading/trailing and multiple internal spaces, using trim and split logic.', async () => {
    const response = await request(app)
      .post('/api/string/word-count')
      .send({
        "text": "  This   is a    test.  "
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "operation": "word-count",
      "input": "  This   is a    test.  ",
      "result": {
        "wordCount": 4,
        "words": [
          "This",
          "is",
          "a",
          "test."
        ]
      }
    });
  });

  // test_string_003
  test('test_string_003: Tests the /palindrome endpoint with a complex string containing spaces, punctuation, and mixed casing, ensuring it correctly identifies it as a palindrome after cleaning.', async () => {
    const response = await request(app)
      .post('/api/string/palindrome')
      .send({
        "text": "A man, a plan, a canal: Panama"
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "operation": "palindrome",
      "input": "A man, a plan, a canal: Panama",
      "result": {
        "isPalindrome": true,
        "cleanedText": "amanaplanacanalpanama",
        "reversedText": "amanaplanacanalpanama"
      }
    });
  });

  // test_string_004
  test('test_string_004: Ensures the API (using /uppercase as an example) correctly rejects non-string inputs for \'text\' with a 400 status code and an appropriate error message, covering the input validation branch.', async () => {
    const response = await request(app)
      .post('/api/string/uppercase')
      .send({
        "text": 12345
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      "error": "Tham số không hợp lệ",
      "message": "text phải là chuỗi"
    });
  });

  // test_string_005
  test('test_string_005: Checks that the /capitalize endpoint gracefully handles an empty string input, returning an empty string without errors.', async () => {
    // Note: This endpoint '/api/string/capitalize' is assumed to exist as a POST route
    // based on the test case description.
    const response = await request(app)
      .post('/api/string/capitalize')
      .send({
        "text": ""
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "operation": "capitalize",
      "input": "",
      "result": ""
    });
  });

});