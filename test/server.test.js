// server.test.js
const request = require('supertest');
const app = require('./server'); // Assuming your Express app is exported from server.js

// Helper function to validate body structure
const validateBodyStructure = (body, structure) => {
    for (const key in structure) {
        if (Object.prototype.hasOwnProperty.call(structure, key)) {
            const expectedType = structure[key];
            expect(body).toHaveProperty(key);

            if (typeof expectedType === 'object' && expectedType !== null && !Array.isArray(expectedType)) {
                // Nested object, recurse
                validateBodyStructure(body[key], expectedType);
            } else if (Array.isArray(expectedType)) {
                // For arrays, check if body[key] is an array
                expect(Array.isArray(body[key])).toBe(true);
                // If the array structure specifies a type for its elements, e.g., ["string"]
                if (expectedType.length > 0 && typeof expectedType[0] === 'string') {
                    body[key].forEach(item => expect(typeof item).toBe(expectedType[0]));
                }
            } else {
                // Primitive type (string, number, boolean)
                // Note: typeof null is 'object', typeof Array is 'object'
                expect(typeof body[key]).toBe(expectedType);
            }
        }
    }
};

describe('API Endpoints (server.js)', () => {
    // app_001: GET / - Root endpoint check
    test('app_001: GET / - Root endpoint check', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Chào mừng đến với Express Math & String API!');
        validateBodyStructure(response.body, {
            "message": "string",
            "endpoints": {
                "math": {
                    "add": "string",
                    "subtract": "string",
                    "multiply": "string",
                    "divide": "string",
                    "power": "string",
                    "factorial": "string",
                    "fibonacci": "string"
                },
                "string": {
                    "reverse": "string",
                    "uppercase": "string",
                    "lowercase": "string",
                    "wordCount": "string",
                    "charCount": "string",
                    "palindrome": "string",
                    "removeSpaces": "string"
                }
            }
        });
    });

    // app_002: GET /unknown-route - 404 Not Found handler
    test('app_002: GET /unknown-route - 404 Not Found handler', async () => {
        const response = await request(app).get('/unknown-route');
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            "error": "Endpoint không tồn tại!",
            "message": "Vui lòng kiểm tra lại đường dẫn API"
        });
    });

    // app_003: POST /api/math/add with non-JSON Content-Type - Missing parameters
    test('app_003: POST /api/math/add with non-JSON Content-Type - Missing parameters', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'text/plain')
            .send('num1=10&num2=20'); // Sending as plain text, not form-urlencoded or JSON
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Invalid input');
    });

    // app_004: POST /api/math/add with malformed JSON - 400 Bad Request (from express.json)
    test('app_004: POST /api/math/add with malformed JSON - 400 Bad Request (from express.json)', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            // Malformed JSON body
            .send('{ "num1": 10, "num2": 20,');
        expect(response.statusCode).toBe(400);
        // The exact error message might vary slightly between Node.js versions or Express configurations.
        // Using toContain for robustness.
        expect(response.text).toContain('Unexpected end of JSON input');
    });

    // Math endpoint tests
    // math_001: POST /api/math/add - Valid positive integers
    test('math_001: POST /api/math/add - Valid positive integers', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: 10, num2: 20 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 30 });
    });

    // math_002: POST /api/math/add - Valid negative integers
    test('math_002: POST /api/math/add - Valid negative integers', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: -5, num2: -15 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: -20 });
    });

    // math_003: POST /api/math/add - Valid mixed integers (positive and negative)
    test('math_003: POST /api/math/add - Valid mixed integers (positive and negative)', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: 100, num2: -75 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 25 });
    });

    // math_004: POST /api/math/add - Valid floats
    test('math_004: POST /api/math/add - Valid floats', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: 10.5, num2: 20.3 });
        expect(response.statusCode).toBe(200);
        expect(response.body.result).toBeCloseTo(30.8); // Use toBeCloseTo for floats
    });

    // math_005: POST /api/math/add - One missing parameter
    test('math_005: POST /api/math/add - One missing parameter', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: 10 });
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Invalid input');
    });

    // math_006: POST /api/math/add - Invalid data type for a parameter (string instead of number)
    test('math_006: POST /api/math/add - Invalid data type for a parameter (string instead of number)', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: "abc", num2: 20 });
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Invalid input');
    });

    // math_007: POST /api/math/subtract - Valid positive integers
    test('math_007: POST /api/math/subtract - Valid positive integers', async () => {
        const response = await request(app)
            .post('/api/math/subtract')
            .set('Content-Type', 'application/json')
            .send({ num1: 30, num2: 10 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 20 });
    });

    // math_008: POST /api/math/subtract - Result is negative
    test('math_008: POST /api/math/subtract - Result is negative', async () => {
        const response = await request(app)
            .post('/api/math/subtract')
            .set('Content-Type', 'application/json')
            .send({ num1: 10, num2: 30 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: -20 });
    });

    // math_009: POST /api/math/subtract - One missing parameter
    test('math_009: POST /api/math/subtract - One missing parameter', async () => {
        const response = await request(app)
            .post('/api/math/subtract')
            .set('Content-Type', 'application/json')
            .send({ num1: 10 });
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Invalid input');
    });

    // math_010: POST /api/math/multiply - Valid positive integers
    test('math_010: POST /api/math/multiply - Valid positive integers', async () => {
        const response = await request(app)
            .post('/api/math/multiply')
            .set('Content-Type', 'application/json')
            .send({ num1: 5, num2: 4 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 20 });
    });

    // math_011: POST /api/math/multiply - Multiplication by zero
    test('math_011: POST /api/math/multiply - Multiplication by zero', async () => {
        const response = await request(app)
            .post('/api/math/multiply')
            .set('Content-Type', 'application/json')
            .send({ num1: 10, num2: 0 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 0 });
    });

    // math_012: POST /api/math/divide - Valid division
    test('math_012: POST /api/math/divide - Valid division', async () => {
        const response = await request(app)
            .post('/api/math/divide')
            .set('Content-Type', 'application/json')
            .send({ num1: 100, num2: 10 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 10 });
    });

    // math_013: POST /api/math/divide - Division by zero
    test('math_013: POST /api/math/divide - Division by zero', async () => {
        const response = await request(app)
            .post('/api/math/divide')
            .set('Content-Type', 'application/json')
            .send({ num1: 10, num2: 0 });
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Cannot divide by zero');
    });

    // math_014: POST /api/math/power - Positive base and exponent
    test('math_014: POST /api/math/power - Positive base and exponent', async () => {
        const response = await request(app)
            .post('/api/math/power')
            .set('Content-Type', 'application/json')
            .send({ base: 2, exponent: 3 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 8 });
    });

    // math_015: POST /api/math/power - Zero exponent
    test('math_015: POST /api/math/power - Zero exponent', async () => {
        const response = await request(app)
            .post('/api/math/power')
            .set('Content-Type', 'application/json')
            .send({ base: 5, exponent: 0 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 1 });
    });

    // math_016: POST /api/math/power - Zero base, positive exponent
    test('math_016: POST /api/math/power - Zero base, positive exponent', async () => {
        const response = await request(app)
            .post('/api/math/power')
            .set('Content-Type', 'application/json')
            .send({ base: 0, exponent: 5 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 0 });
    });

    // math_017: POST /api/math/power - Negative exponent
    test('math_017: POST /api/math/power - Negative exponent', async () => {
        const response = await request(app)
            .post('/api/math/power')
            .set('Content-Type', 'application/json')
            .send({ base: 2, exponent: -2 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 0.25 });
    });

    // math_018: POST /api/math/power - Missing base parameter
    test('math_018: POST /api/math/power - Missing base parameter', async () => {
        const response = await request(app)
            .post('/api/math/power')
            .set('Content-Type', 'application/json')
            .send({ exponent: 3 });
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Invalid input');
    });

    // math_019: GET /api/math/factorial/:n - Valid positive integer (5)
    test('math_019: GET /api/math/factorial/:n - Valid positive integer (5)', async () => {
        const response = await request(app).get('/api/math/factorial/5');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 120 });
    });

    // math_020: GET /api/math/factorial/:n - Zero
    test('math_020: GET /api/math/factorial/:n - Zero', async () => {
        const response = await request(app).get('/api/math/factorial/0');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 1 });
    });

    // math_021: GET /api/math/factorial/:n - Negative integer
    test('math_021: GET /api/math/factorial/:n - Negative integer', async () => {
        const response = await request(app).get('/api/math/factorial/-5');
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Input must be a non-negative integer');
    });

    // math_022: GET /api/math/factorial/:n - Non-integer (float)
    test('math_022: GET /api/math/factorial/:n - Non-integer (float)', async () => {
        const response = await request(app).get('/api/math/factorial/3.5');
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Input must be a non-negative integer');
    });

    // math_023: GET /api/math/factorial/:n - Non-numeric input
    test('math_023: GET /api/math/factorial/:n - Non-numeric input', async () => {
        const response = await request(app).get('/api/math/factorial/abc');
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Input must be a number');
    });

    // math_024: GET /api/math/fibonacci/:n - Valid positive integer (7)
    test('math_024: GET /api/math/fibonacci/:n - Valid positive integer (7)', async () => {
        const response = await request(app).get('/api/math/fibonacci/7');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 13 });
    });

    // math_025: GET /api/math/fibonacci/:n - Zero
    test('math_025: GET /api/math/fibonacci/:n - Zero', async () => {
        const response = await request(app).get('/api/math/fibonacci/0');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 0 });
    });

    // math_026: GET /api/math/fibonacci/:n - Negative integer
    test('math_026: GET /api/math/fibonacci/:n - Negative integer', async () => {
        const response = await request(app).get('/api/math/fibonacci/-3');
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Input must be a non-negative integer');
    });

    // math_027: GET /api/math/fibonacci/:n - Non-numeric input
    test('math_027: GET /api/math/fibonacci/:n - Non-numeric input', async () => {
        const response = await request(app).get('/api/math/fibonacci/xyz');
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Input must be a number');
    });

    // String endpoint tests
    // string_001: POST /api/string/reverse - Valid string
    test('string_001: POST /api/string/reverse - Valid string', async () => {
        const response = await request(app)
            .post('/api/string/reverse')
            .set('Content-Type', 'application/json')
            .send({ text: 'hello' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 'olleh' });
    });

    // string_002: POST /api/string/reverse - Empty string
    test('string_002: POST /api/string/reverse - Empty string', async () => {
        const response = await request(app)
            .post('/api/string/reverse')
            .set('Content-Type', 'application/json')
            .send({ text: '' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: '' });
    });

    // string_003: POST /api/string/reverse - String with spaces and special characters
    test('string_003: POST /api/string/reverse - String with spaces and special characters', async () => {
        const response = await request(app)
            .post('/api/string/reverse')
            .set('Content-Type', 'application/json')
            .send({ text: 'Hello World! 123' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: '321 !dlroW olleH' });
    });

    // string_004: POST /api/string/reverse - Missing 'text' parameter
    test('string_004: POST /api/string/reverse - Missing \'text\' parameter', async () => {
        const response = await request(app)
            .post('/api/string/reverse')
            .set('Content-Type', 'application/json')
            .send({});
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain("Input 'text' is required");
    });

    // string_005: POST /api/string/uppercase - Valid string
    test('string_005: POST /api/string/uppercase - Valid string', async () => {
        const response = await request(app)
            .post('/api/string/uppercase')
            .set('Content-Type', 'application/json')
            .send({ text: 'hello world' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 'HELLO WORLD' });
    });

    // string_006: POST /api/string/lowercase - Valid string
    test('string_006: POST /api/string/lowercase - Valid string', async () => {
        const response = await request(app)
            .post('/api/string/lowercase')
            .set('Content-Type', 'application/json')
            .send({ text: 'HELLO WORLD' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 'hello world' });
    });

    // string_007: POST /api/string/word-count - Multiple words
    test('string_007: POST /api/string/word-count - Multiple words', async () => {
        const response = await request(app)
            .post('/api/string/word-count')
            .set('Content-Type', 'application/json')
            .send({ text: 'This is a test string' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 5 });
    });

    // string_008: POST /api/string/word-count - Empty string
    test('string_008: POST /api/string/word-count - Empty string', async () => {
        const response = await request(app)
            .post('/api/string/word-count')
            .set('Content-Type', 'application/json')
            .send({ text: '' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 0 });
    });

    // string_009: POST /api/string/word-count - String with leading/trailing/multiple internal spaces
    test('string_009: POST /api/string/word-count - String with leading/trailing/multiple internal spaces', async () => {
        const response = await request(app)
            .post('/api/string/word-count')
            .set('Content-Type', 'application/json')
            .send({ text: '  Hello   World  ' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 2 });
    });

    // string_010: POST /api/string/char-count - Valid string
    test('string_010: POST /api/string/char-count - Valid string', async () => {
        const response = await request(app)
            .post('/api/string/char-count')
            .set('Content-Type', 'application/json')
            .send({ text: 'hello' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 5 });
    });

    // string_011: POST /api/string/char-count - Empty string
    test('string_011: POST /api/string/char-count - Empty string', async () => {
        const response = await request(app)
            .post('/api/string/char-count')
            .set('Content-Type', 'application/json')
            .send({ text: '' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 0 });
    });

    // string_012: POST /api/string/char-count - String with spaces and special characters
    test('string_012: POST /api/string/char-count - String with spaces and special characters', async () => {
        const response = await request(app)
            .post('/api/string/char-count')
            .set('Content-Type', 'application/json')
            .send({ text: 'Hello World! 123' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 16 });
    });

    // string_013: POST /api/string/palindrome - Palindrome (case-sensitive)
    test('string_013: POST /api/string/palindrome - Palindrome (case-sensitive)', async () => {
        const response = await request(app)
            .post('/api/string/palindrome')
            .set('Content-Type', 'application/json')
            .send({ text: 'madam' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: true });
    });

    // string_014: POST /api/string/palindrome - Not a palindrome
    test('string_014: POST /api/string/palindrome - Not a palindrome', async () => {
        const response = await request(app)
            .post('/api/string/palindrome')
            .set('Content-Type', 'application/json')
            .send({ text: 'hello' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: false });
    });

    // string_015: POST /api/string/palindrome - Palindrome with mixed case (assumed case-sensitive check)
    test('string_015: POST /api/string/palindrome - Palindrome with mixed case (assumed case-sensitive check)', async () => {
        const response = await request(app)
            .post('/api/string/palindrome')
            .set('Content-Type', 'application/json')
            .send({ text: 'Madam' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: false });
    });

    // string_016: POST /api/string/palindrome - Palindrome with spaces (assumed spaces matter)
    test('string_016: POST /api/string/palindrome - Palindrome with spaces (assumed spaces matter)', async () => {
        const response = await request(app)
            .post('/api/string/palindrome')
            .set('Content-Type', 'application/json')
            .send({ text: 'A man a plan a canal Panama' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: false });
    });

    // string_017: POST /api/string/remove-spaces - String with leading/trailing/multiple internal spaces
    test('string_017: POST /api/string/remove-spaces - String with leading/trailing/multiple internal spaces', async () => {
        const response = await request(app)
            .post('/api/string/remove-spaces')
            .set('Content-Type', 'application/json')
            .send({ text: '  Hello   World  ' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 'HelloWorld' });
    });

    // string_018: POST /api/string/remove-spaces - String with no spaces
    test('string_018: POST /api/string/remove-spaces - String with no spaces', async () => {
        const response = await request(app)
            .post('/api/string/remove-spaces')
            .set('Content-Type', 'application/json')
            .send({ text: 'HelloWorld' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: 'HelloWorld' });
    });

    // string_019: POST /api/string/remove-spaces - Empty string
    test('string_019: POST /api/string/remove-spaces - Empty string', async () => {
        const response = await request(app)
            .post('/api/string/remove-spaces')
            .set('Content-Type', 'application/json')
            .send({ text: '' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: '' });
    });

    // string_020: POST /api/string/remove-spaces - String with only spaces
    test('string_020: POST /api/string/remove-spaces - String with only spaces', async () => {
        const response = await request(app)
            .post('/api/string/remove-spaces')
            .set('Content-Type', 'application/json')
            .send({ text: '   ' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ result: '' });
    });

    // general_error_001: POST /api/math/add - Simulate internal server error
    test('general_error_001: POST /api/math/add - Simulate internal server error (e.g., service throws an unhandled exception)', async () => {
        const response = await request(app)
            .post('/api/math/add')
            .set('Content-Type', 'application/json')
            .send({ num1: 'trigger_error_from_service', num2: 10 }); // This specific input is assumed to trigger an internal error
        expect(response.statusCode).toBe(500);
        expect(response.text).toContain('Có lỗi xảy ra trên server!');
        validateBodyStructure(response.body, {
            "error": "string",
            "message": "string"
        });
    });
});

// services/stringService.test.js
const stringService = require('./services/stringService'); // Adjust path as necessary, assuming this is run from project root

describe('stringService', () => {
    // test_reverse_001: Reverse: Valid standard string
    test('test_reverse_001: Reverse: Valid standard string', () => {
        const result = stringService.reverse('hello');
        expect(result).toEqual({
            operation: 'reverse',
            input: 'hello',
            result: 'olleh'
        });
    });

    // test_reverse_002: Reverse: Valid string with spaces
    test('test_reverse_002: Reverse: Valid string with spaces', () => {
        const result = stringService.reverse('hello world');
        expect(result).toEqual({
            operation: 'reverse',
            input: 'hello world',
            result: 'dlrow olleh'
        });
    });

    // test_reverse_003: Reverse: Valid empty string
    test('test_reverse_003: Reverse: Valid empty string', () => {
        const result = stringService.reverse('');
        expect(result).toEqual({
            operation: 'reverse',
            input: '',
            result: ''
        });
    });

    // test_reverse_004: Reverse: Valid single character string
    test('test_reverse_004: Reverse: Valid single character string', () => {
        const result = stringService.reverse('a');
        expect(result).toEqual({
            operation: 'reverse',
            input: 'a',
            result: 'a'
        });
    });

    // test_reverse_005: Reverse: Valid string with numbers and special characters
    test('test_reverse_005: Reverse: Valid string with numbers and special characters', () => {
        const result = stringService.reverse('123!abc$');
        expect(result).toEqual({
            operation: 'reverse',
            input: '123!abc$',
            result: '$cba!321'
        });
    });

    // test_reverse_006: Reverse: Valid string with Unicode characters
    test('test_reverse_006: Reverse: Valid string with Unicode characters', () => {
        const result = stringService.reverse('Xin chào');
        expect(result).toEqual({
            operation: 'reverse',
            input: 'Xin chào',
            result: 'oàhc niX'
        });
    });

    // test_reverse_007: Reverse: Invalid input - text is a number
    test('test_reverse_007: Reverse: Invalid input - text is a number', async () => {
        await expect(async () => {
            stringService.reverse(123);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_reverse_008: Reverse: Invalid input - text is a boolean
    test('test_reverse_008: Reverse: Invalid input - text is a boolean', async () => {
        await expect(async () => {
            stringService.reverse(true);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_reverse_009: Reverse: Invalid input - text is an object
    test('test_reverse_009: Reverse: Invalid input - text is an object', async () => {
        await expect(async () => {
            stringService.reverse({ value: 'hello' });
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_reverse_010: Reverse: Invalid input - text is null
    test('test_reverse_010: Reverse: Invalid input - text is null', async () => {
        await expect(async () => {
            stringService.reverse(null);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_reverse_011: Reverse: Invalid input - missing text field
    test('test_reverse_011: Reverse: Invalid input - missing text field', async () => {
        await expect(async () => {
            stringService.reverse(undefined); // Simulate missing 'text' field in the argument
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_uppercase_001: Uppercase: Valid mixed case string
    test('test_uppercase_001: Uppercase: Valid mixed case string', () => {
        const result = stringService.uppercase('Hello World');
        expect(result).toEqual({
            operation: 'uppercase',
            input: 'Hello World',
            result: 'HELLO WORLD'
        });
    });

    // test_uppercase_002: Uppercase: Valid all lowercase string
    test('test_uppercase_002: Uppercase: Valid all lowercase string', () => {
        const result = stringService.uppercase('javascript');
        expect(result).toEqual({
            operation: 'uppercase',
            input: 'javascript',
            result: 'JAVASCRIPT'
        });
    });

    // test_uppercase_003: Uppercase: Valid all uppercase string
    test('test_uppercase_003: Uppercase: Valid all uppercase string', () => {
        const result = stringService.uppercase('TEST');
        expect(result).toEqual({
            operation: 'uppercase',
            input: 'TEST',
            result: 'TEST'
        });
    });

    // test_uppercase_004: Uppercase: Valid empty string
    test('test_uppercase_004: Uppercase: Valid empty string', () => {
        const result = stringService.uppercase('');
        expect(result).toEqual({
            operation: 'uppercase',
            input: '',
            result: ''
        });
    });

    // test_uppercase_005: Uppercase: Valid string with numbers and special characters
    test('test_uppercase_005: Uppercase: Valid string with numbers and special characters', () => {
        const result = stringService.uppercase('123!abc#');
        expect(result).toEqual({
            operation: 'uppercase',
            input: '123!abc#',
            result: '123!ABC#'
        });
    });

    // test_uppercase_006: Uppercase: Valid string with Unicode characters
    test('test_uppercase_006: Uppercase: Valid string with Unicode characters', () => {
        const result = stringService.uppercase('Xin chào thế giới');
        expect(result).toEqual({
            operation: 'uppercase',
            input: 'Xin chào thế giới',
            result: 'XIN CHÀO THẾ GIỚI'
        });
    });

    // test_uppercase_007: Uppercase: Invalid input - text is a number
    test('test_uppercase_007: Uppercase: Invalid input - text is a number', async () => {
        await expect(async () => {
            stringService.uppercase(456);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_lowercase_001: Lowercase: Valid mixed case string
    test('test_lowercase_001: Lowercase: Valid mixed case string', () => {
        const result = stringService.lowercase('Hello World');
        expect(result).toEqual({
            operation: 'lowercase',
            input: 'Hello World',
            result: 'hello world'
        });
    });

    // test_lowercase_002: Lowercase: Valid all uppercase string
    test('test_lowercase_002: Lowercase: Valid all uppercase string', () => {
        const result = stringService.lowercase('JAVASCRIPT');
        expect(result).toEqual({
            operation: 'lowercase',
            input: 'JAVASCRIPT',
            result: 'javascript'
        });
    });

    // test_lowercase_003: Lowercase: Valid all lowercase string
    test('test_lowercase_003: Lowercase: Valid all lowercase string', () => {
        const result = stringService.lowercase('test');
        expect(result).toEqual({
            operation: 'lowercase',
            input: 'test',
            result: 'test'
        });
    });

    // test_lowercase_004: Lowercase: Valid empty string
    test('test_lowercase_004: Lowercase: Valid empty string', () => {
        const result = stringService.lowercase('');
        expect(result).toEqual({
            operation: 'lowercase',
            input: '',
            result: ''
        });
    });

    // test_lowercase_005: Lowercase: Valid string with numbers and special characters
    test('test_lowercase_005: Lowercase: Valid string with numbers and special characters', () => {
        const result = stringService.lowercase('123!ABC#');
        expect(result).toEqual({
            operation: 'lowercase',
            input: '123!ABC#',
            result: '123!abc#'
        });
    });

    // test_lowercase_006: Lowercase: Valid string with Unicode characters
    test('test_lowercase_006: Lowercase: Valid string with Unicode characters', () => {
        const result = stringService.lowercase('XIN CHÀO THẾ GIỚI');
        expect(result).toEqual({
            operation: 'lowercase',
            input: 'XIN CHÀO THẾ GIỚI',
            result: 'xin chào thế giới'
        });
    });

    // test_lowercase_007: Lowercase: Invalid input - text is a number
    test('test_lowercase_007: Lowercase: Invalid input - text is a number', async () => {
        await expect(async () => {
            stringService.lowercase(789);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_word_count_001: Word Count: Valid standard sentence
    test('test_word_count_001: Word Count: Valid standard sentence', () => {
        const result = stringService.wordCount('Hello world, this is a test.');
        expect(result).toEqual({
            operation: 'word-count',
            input: 'Hello world, this is a test.',
            result: {
                wordCount: 6,
                words: ['Hello', 'world,', 'this', 'is', 'a', 'test.']
            }
        });
    });

    // test_word_count_002: Word Count: Valid string with multiple spaces
    test('test_word_count_002: Word Count: Valid string with multiple spaces', () => {
        const result = stringService.wordCount('  Hello   world    ');
        expect(result).toEqual({
            operation: 'word-count',
            input: '  Hello   world    ',
            result: {
                wordCount: 2,
                words: ['Hello', 'world']
            }
        });
    });

    // test_word_count_003: Word Count: Valid empty string
    test('test_word_count_003: Word Count: Valid empty string', () => {
        const result = stringService.wordCount('');
        expect(result).toEqual({
            operation: 'word-count',
            input: '',
            result: {
                wordCount: 0,
                words: []
            }
        });
    });

    // test_word_count_004: Word Count: Valid string with only spaces
    test('test_word_count_004: Word Count: Valid string with only spaces', () => {
        const result = stringService.wordCount('     ');
        expect(result).toEqual({
            operation: 'word-count',
            input: '     ',
            result: {
                wordCount: 0,
                words: []
            }
        });
    });

    // test_word_count_005: Word Count: Valid single word string
    test('test_word_count_005: Word Count: Valid single word string', () => {
        const result = stringService.wordCount('word');
        expect(result).toEqual({
            operation: 'word-count',
            input: 'word',
            result: {
                wordCount: 1,
                words: ['word']
            }
        });
    });

    // test_word_count_006: Word Count: Valid string with numbers as words
    test('test_word_count_006: Word Count: Valid string with numbers as words', () => {
        const result = stringService.wordCount('123 test 456');
        expect(result).toEqual({
            operation: 'word-count',
            input: '123 test 456',
            result: {
                wordCount: 3,
                words: ['123', 'test', '456']
            }
        });
    });

    // test_word_count_007: Word Count: Valid string with Unicode words
    test('test_word_count_007: Word Count: Valid string with Unicode words', () => {
        const result = stringService.wordCount('Xin chào thế giới');
        expect(result).toEqual({
            operation: 'word-count',
            input: 'Xin chào thế giới',
            result: {
                wordCount: 4,
                words: ['Xin', 'chào', 'thế', 'giới']
            }
        });
    });

    // test_word_count_008: Word Count: Invalid input - text is an array
    test('test_word_count_008: Word Count: Invalid input - text is an array', async () => {
        await expect(async () => {
            stringService.wordCount(['word1', 'word2']);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_char_count_001: Char Count: Valid standard string
    test('test_char_count_001: Char Count: Valid standard string', () => {
        const result = stringService.charCount('hello');
        expect(result).toEqual({
            operation: 'char-count',
            input: 'hello',
            result: {
                totalCharacters: 5,
                charactersWithoutSpaces: 5,
                spaces: 0
            }
        });
    });

    // test_char_count_002: Char Count: Valid string with spaces
    test('test_char_count_002: Char Count: Valid string with spaces', () => {
        const result = stringService.charCount('hello world');
        expect(result).toEqual({
            operation: 'char-count',
            input: 'hello world',
            result: {
                totalCharacters: 11,
                charactersWithoutSpaces: 10,
                spaces: 1
            }
        });
    });

    // test_char_count_003: Char Count: Valid empty string
    test('test_char_count_003: Char Count: Valid empty string', () => {
        const result = stringService.charCount('');
        expect(result).toEqual({
            operation: 'char-count',
            input: '',
            result: {
                totalCharacters: 0,
                charactersWithoutSpaces: 0,
                spaces: 0
            }
        });
    });

    // test_char_count_004: Char Count: Valid string with only spaces
    test('test_char_count_004: Char Count: Valid string with only spaces', () => {
        const result = stringService.charCount('   ');
        expect(result).toEqual({
            operation: 'char-count',
            input: '   ',
            result: {
                totalCharacters: 3,
                charactersWithoutSpaces: 0,
                spaces: 3
            }
        });
    });

    // test_char_count_005: Char Count: Valid string with numbers and special characters
    test('test_char_count_005: Char Count: Valid string with numbers and special characters', () => {
        const result = stringService.charCount('123!@#');
        expect(result).toEqual({
            operation: 'char-count',
            input: '123!@#',
            result: {
                totalCharacters: 6,
                charactersWithoutSpaces: 6,
                spaces: 0
            }
        });
    });

    // test_char_count_006: Char Count: Valid string with Unicode characters and spaces
    test('test_char_count_006: Char Count: Valid string with Unicode characters and spaces', () => {
        const result = stringService.charCount('Xin chào!');
        expect(result).toEqual({
            operation: 'char-count',
            input: 'Xin chào!',
            result: {
                totalCharacters: 9,
                charactersWithoutSpaces: 8,
                spaces: 1
            }
        });
    });

    // test_char_count_007: Char Count: Invalid input - text is null
    test('test_char_count_007: Char Count: Invalid input - text is null', async () => {
        await expect(async () => {
            stringService.charCount(null);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_palindrome_001: Palindrome: Valid palindrome string (lowercase)
    test('test_palindrome_001: Palindrome: Valid palindrome string (lowercase)', () => {
        const result = stringService.palindrome('madam');
        expect(result).toEqual({
            operation: 'palindrome',
            input: 'madam',
            result: {
                isPalindrome: true,
                cleanedText: 'madam',
                reversedText: 'madam'
            }
        });
    });

    // test_palindrome_002: Palindrome: Valid palindrome string (mixed case and spaces)
    test('test_palindrome_002: Palindrome: Valid palindrome string (mixed case and spaces)', () => {
        const result = stringService.palindrome('A man a plan a canal Panama');
        expect(result).toEqual({
            operation: 'palindrome',
            input: 'A man a plan a canal Panama',
            result: {
                isPalindrome: true,
                cleanedText: 'amanaplanacanalpanama',
                reversedText: 'amanaplanacanalpanama'
            }
        });
    });

    // test_palindrome_003: Palindrome: Valid non-palindrome string
    test('test_palindrome_003: Palindrome: Valid non-palindrome string', () => {
        const result = stringService.palindrome('hello world');
        expect(result).toEqual({
            operation: 'palindrome',
            input: 'hello world',
            result: {
                isPalindrome: false,
                cleanedText: 'helloworld',
                reversedText: 'dlrowolleh'
            }
        });
    });

    // test_palindrome_004: Palindrome: Valid empty string
    test('test_palindrome_004: Palindrome: Valid empty string', () => {
        const result = stringService.palindrome('');
        expect(result).toEqual({
            operation: 'palindrome',
            input: '',
            result: {
                isPalindrome: true,
                cleanedText: '',
                reversedText: ''
            }
        });
    });

    // test_palindrome_005: Palindrome: Valid single character string
    test('test_palindrome_005: Palindrome: Valid single character string', () => {
        const result = stringService.palindrome('x');
        expect(result).toEqual({
            operation: 'palindrome',
            input: 'x',
            result: {
                isPalindrome: true,
                cleanedText: 'x',
                reversedText: 'x'
            }
        });
    });

    // test_palindrome_006: Palindrome: Valid string with only spaces
    test('test_palindrome_006: Palindrome: Valid string with only spaces', () => {
        const result = stringService.palindrome('   ');
        expect(result).toEqual({
            operation: 'palindrome',
            input: '   ',
            result: {
                isPalindrome: true,
                cleanedText: '',
                reversedText: ''
            }
        });
    });

    // test_palindrome_007: Palindrome: Valid palindrome with numbers and symbols (cleaned)
    test('test_palindrome_007: Palindrome: Valid palindrome with numbers and symbols (cleaned)', () => {
        const result = stringService.palindrome('1racecar1');
        expect(result).toEqual({
            operation: 'palindrome',
            input: '1racecar1',
            result: {
                isPalindrome: true,
                cleanedText: '1racecar1',
                reversedText: '1racecar1'
            }
        });
    });

    // test_palindrome_008: Palindrome: Invalid input - text is a boolean
    test('test_palindrome_008: Palindrome: Invalid input - text is a boolean', async () => {
        await expect(async () => {
            stringService.palindrome(false);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_remove_spaces_001: Remove Spaces: Valid standard string with spaces
    test('test_remove_spaces_001: Remove Spaces: Valid standard string with spaces', () => {
        const result = stringService.removeSpaces('hello world');
        expect(result).toEqual({
            operation: 'remove-spaces',
            input: 'hello world',
            result: 'helloworld'
        });
    });

    // test_remove_spaces_002: Remove Spaces: Valid string with multiple spaces
    test('test_remove_spaces_002: Remove Spaces: Valid string with multiple spaces', () => {
        const result = stringService.removeSpaces('  hello   world  ');
        expect(result).toEqual({
            operation: 'remove-spaces',
            input: '  hello   world  ',
            result: 'helloworld'
        });
    });

    // test_remove_spaces_003: Remove Spaces: Valid empty string
    test('test_remove_spaces_003: Remove Spaces: Valid empty string', () => {
        const result = stringService.removeSpaces('');
        expect(result).toEqual({
            operation: 'remove-spaces',
            input: '',
            result: ''
        });
    });

    // test_remove_spaces_004: Remove Spaces: Valid string with only spaces
    test('test_remove_spaces_004: Remove Spaces: Valid string with only spaces', () => {
        const result = stringService.removeSpaces('     ');
        expect(result).toEqual({
            operation: 'remove-spaces',
            input: '     ',
            result: ''
        });
    });

    // test_remove_spaces_005: Remove Spaces: Valid string with no spaces
    test('test_remove_spaces_005: Remove Spaces: Valid string with no spaces', () => {
        const result = stringService.removeSpaces('test');
        expect(result).toEqual({
            operation: 'remove-spaces',
            input: 'test',
            result: 'test'
        });
    });

    // test_remove_spaces_006: Remove Spaces: Valid string with various whitespace characters
    test('test_remove_spaces_006: Remove Spaces: Valid string with various whitespace characters', () => {
        const result = stringService.removeSpaces('hello\tworld\nwith\rspaces');
        expect(result).toEqual({
            operation: 'remove-spaces',
            input: 'hello\tworld\nwith\rspaces',
            result: 'helloworldwithspaces'
        });
    });

    // test_remove_spaces_007: Remove Spaces: Invalid input - missing text field
    test('test_remove_spaces_007: Remove Spaces: Invalid input - missing text field', async () => {
        await expect(async () => {
            stringService.removeSpaces(undefined); // Simulate missing 'text' field
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_capitalize_001: Capitalize: Valid standard string (lowercase)
    test('test_capitalize_001: Capitalize: Valid standard string (lowercase)', () => {
        const result = stringService.capitalize('hello world');
        expect(result).toEqual({
            operation: 'capitalize',
            input: 'hello world',
            result: 'Hello world'
        });
    });

    // test_capitalize_002: Capitalize: Valid standard string (mixed case)
    test('test_capitalize_002: Capitalize: Valid standard string (mixed case)', () => {
        const result = stringService.capitalize('jAVASCRIPT');
        expect(result).toEqual({
            operation: 'capitalize',
            input: 'jAVASCRIPT',
            result: 'Javascript'
        });
    });

    // test_capitalize_003: Capitalize: Valid empty string
    test('test_capitalize_003: Capitalize: Valid empty string', () => {
        const result = stringService.capitalize('');
        expect(result).toEqual({
            operation: 'capitalize',
            input: '',
            result: ''
        });
    });

    // test_capitalize_004: Capitalize: Valid single character string (lowercase)
    test('test_capitalize_004: Capitalize: Valid single character string (lowercase)', () => {
        const result = stringService.capitalize('a');
        expect(result).toEqual({
            operation: 'capitalize',
            input: 'a',
            result: 'A'
        });
    });

    // test_capitalize_005: Capitalize: Valid single character string (uppercase)
    test('test_capitalize_005: Capitalize: Valid single character string (uppercase)', () => {
        const result = stringService.capitalize('B');
        expect(result).toEqual({
            operation: 'capitalize',
            input: 'B',
            result: 'B'
        });
    });

    // test_capitalize_006: Capitalize: Valid string starting with a space
    test('test_capitalize_006: Capitalize: Valid string starting with a space', () => {
        const result = stringService.capitalize(' hello');
        expect(result).toEqual({
            operation: 'capitalize',
            input: ' hello',
            result: ' hello'
        });
    });

    // test_capitalize_007: Capitalize: Valid string starting with a number
    test('test_capitalize_007: Capitalize: Valid string starting with a number', () => {
        const result = stringService.capitalize('123test');
        expect(result).toEqual({
            operation: 'capitalize',
            input: '123test',
            result: '123test'
        });
    });

    // test_capitalize_008: Capitalize: Valid string with Unicode character at start
    test('test_capitalize_008: Capitalize: Valid string with Unicode character at start', () => {
        const result = stringService.capitalize('xin chào');
        expect(result).toEqual({
            operation: 'capitalize',
            input: 'xin chào',
            result: 'Xin chào'
        });
    });

    // test_capitalize_009: Capitalize: Invalid input - text is an object
    test('test_capitalize_009: Capitalize: Invalid input - text is an object', async () => {
        await expect(async () => {
            stringService.capitalize({ data: 'test' });
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });

    // test_trim_001: Trim: Valid string with leading and trailing spaces
    test('test_trim_001: Trim: Valid string with leading and trailing spaces', () => {
        const result = stringService.trim('  hello world  ');
        expect(result).toEqual({
            operation: 'trim',
            input: '  hello world  ',
            result: 'hello world',
            originalLength: 15,
            trimmedLength: 11
        });
    });

    // test_trim_002: Trim: Valid string with only leading spaces
    test('test_trim_002: Trim: Valid string with only leading spaces', () => {
        const result = stringService.trim('   test');
        expect(result).toEqual({
            operation: 'trim',
            input: '   test',
            result: 'test',
            originalLength: 7,
            trimmedLength: 4
        });
    });

    // test_trim_003: Trim: Valid string with only trailing spaces
    test('test_trim_003: Trim: Valid string with only trailing spaces', () => {
        const result = stringService.trim('test   ');
        expect(result).toEqual({
            operation: 'trim',
            input: 'test   ',
            result: 'test',
            originalLength: 7,
            trimmedLength: 4
        });
    });

    // test_trim_004: Trim: Valid string with no spaces
    test('test_trim_004: Trim: Valid string with no spaces', () => {
        const result = stringService.trim('helloworld');
        expect(result).toEqual({
            operation: 'trim',
            input: 'helloworld',
            result: 'helloworld',
            originalLength: 10,
            trimmedLength: 10
        });
    });

    // test_trim_005: Trim: Valid empty string
    test('test_trim_005: Trim: Valid empty string', () => {
        const result = stringService.trim('');
        expect(result).toEqual({
            operation: 'trim',
            input: '',
            result: '',
            originalLength: 0,
            trimmedLength: 0
        });
    });

    // test_trim_006: Trim: Valid string with only spaces (all trimmed)
    test('test_trim_006: Trim: Valid string with only spaces (all trimmed)', () => {
        const result = stringService.trim('   ');
        expect(result).toEqual({
            operation: 'trim',
            input: '   ',
            result: '',
            originalLength: 3,
            trimmedLength: 0
        });
    });

    // test_trim_007: Trim: Valid string with various whitespace characters
    test('test_trim_007: Trim: Valid string with various whitespace characters', () => {
        const result = stringService.trim('\t\n  hello world \r\n');
        expect(result).toEqual({
            operation: 'trim',
            input: '\t\n  hello world \r\n',
            result: 'hello world',
            originalLength: 17,
            trimmedLength: 11
        });
    });

    // test_trim_008: Trim: Invalid input - text is null
    test('test_trim_008: Trim: Invalid input - text is null', async () => {
        await expect(async () => {
            stringService.trim(null);
        }).rejects.toEqual(expect.objectContaining({
            status: 400,
            error: 'Tham số không hợp lệ',
            message: 'text phải là chuỗi'
        }));
    });
});