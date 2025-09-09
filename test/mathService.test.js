// __tests__/mathService.test.js
const mathService = require('../services/mathService'); // Assuming mathService.js exports functions directly

describe('mathService', () => {

  const testCases = [
    {
      "id": "test_001",
      "title": "Add two positive integers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 5, \"b\": 3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": 5, \"b\": 3}, \"result\": 8}}",
      "description": "Should successfully add two positive integers."
    },
    {
      "id": "test_002",
      "title": "Add positive and negative integer",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 10, \"b\": -3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": 10, \"b\": -3}, \"result\": 7}}",
      "description": "Should successfully add a positive and a negative integer."
    },
    {
      "id": "test_003",
      "title": "Add two negative integers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": -5, \"b\": -3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": -5, \"b\": -3}, \"result\": -8}}",
      "description": "Should successfully add two negative integers."
    },
    {
      "id": "test_004",
      "title": "Add zero to a number",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 7, \"b\": 0}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": 7, \"b\": 0}, \"result\": 7}}",
      "description": "Should correctly add zero to a number."
    },
    {
      "id": "test_005",
      "title": "Add two decimal numbers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 2.5, \"b\": 1.75}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": 2.5, \"b\": 1.75}, \"result\": 4.25}}",
      "description": "Should successfully add two decimal numbers."
    },
    {
      "id": "test_006",
      "title": "Add with one missing parameter 'a'",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"b\": 5}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'a' is missing from the request body."
    },
    {
      "id": "test_007",
      "title": "Add with one missing parameter 'b'",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 5}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'b' is missing from the request body."
    },
    {
      "id": "test_008",
      "title": "Add with 'a' as string",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": \"abc\", \"b\": 5}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'a' is not a number."
    },
    {
      "id": "test_009",
      "title": "Add with 'b' as string",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 5, \"b\": \"def\"}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'b' is not a number."
    },
    {
      "id": "test_010",
      "title": "Add with 'a' as null",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": null, \"b\": 5}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'a' is null."
    },
    {
      "id": "test_011",
      "title": "Subtract two positive integers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/subtract\", \"body\": {\"a\": 10, \"b\": 3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"subtraction\", \"operands\": {\"a\": 10, \"b\": 3}, \"result\": 7}}",
      "description": "Should successfully subtract two positive integers."
    },
    {
      "id": "test_012",
      "title": "Subtract a larger number from a smaller number",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/subtract\", \"body\": {\"a\": 3, \"b\": 10}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"subtraction\", \"operands\": {\"a\": 3, \"b\": 10}, \"result\": -7}}",
      "description": "Should correctly subtract a larger number from a smaller number."
    },
    {
      "id": "test_013",
      "title": "Subtract negative from positive",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/subtract\", \"body\": {\"a\": 5, \"b\": -2}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"subtraction\", \"operands\": {\"a\": 5, \"b\": -2}, \"result\": 7}}",
      "description": "Should correctly subtract a negative number from a positive number."
    },
    {
      "id": "test_014",
      "title": "Subtract with 'a' as non-number",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/subtract\", \"body\": {\"a\": [], \"b\": 5}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'a' is an array."
    },
    {
      "id": "test_015",
      "title": "Multiply two positive integers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/multiply\", \"body\": {\"a\": 6, \"b\": 4}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"multiplication\", \"operands\": {\"a\": 6, \"b\": 4}, \"result\": 24}}",
      "description": "Should successfully multiply two positive integers."
    },
    {
      "id": "test_016",
      "title": "Multiply by zero",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/multiply\", \"body\": {\"a\": 10, \"b\": 0}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"multiplication\", \"operands\": {\"a\": 10, \"b\": 0}, \"result\": 0}}",
      "description": "Should correctly multiply any number by zero."
    },
    {
      "id": "test_017",
      "title": "Multiply two negative integers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/multiply\", \"body\": {\"a\": -5, \"b\": -3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"multiplication\", \"operands\": {\"a\": -5, \"b\": -3}, \"result\": 15}}",
      "description": "Should successfully multiply two negative integers."
    },
    {
      "id": "test_018",
      "title": "Multiply with 'b' as boolean",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/multiply\", \"body\": {\"a\": 5, \"b\": true}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'b' is a boolean."
    },
    {
      "id": "test_019",
      "title": "Divide two positive integers",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": 10, \"b\": 2}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"division\", \"operands\": {\"a\": 10, \"b\": 2}, \"result\": 5}}",
      "description": "Should successfully divide two positive integers."
    },
    {
      "id": "test_020",
      "title": "Divide resulting in a decimal",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": 7, \"b\": 2}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"division\", \"operands\": {\"a\": 7, \"b\": 2}, \"result\": 3.5}}",
      "description": "Should correctly divide numbers resulting in a decimal."
    },
    {
      "id": "test_021",
      "title": "Divide by zero",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": 10, \"b\": 0}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Lỗi chia cho 0\", \"message\": \"Không thể chia cho 0\"}}",
      "description": "Should return 400 if attempting to divide by zero."
    },
    {
      "id": "test_022",
      "title": "Divide zero by a non-zero number",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": 0, \"b\": 5}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"division\", \"operands\": {\"a\": 0, \"b\": 5}, \"result\": 0}}",
      "description": "Should correctly divide zero by a non-zero number."
    },
    {
      "id": "test_023",
      "title": "Divide with 'a' as undefined",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": null, \"b\": 5}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả a và b phải là số\"}}",
      "description": "Should return 400 if 'a' is undefined (or null, which `typeof null` is 'object')."
    },
    {
      "id": "test_024",
      "title": "Power with positive base and exponent",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": 2, \"exponent\": 3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": 2, \"exponent\": 3}, \"result\": 8}}",
      "description": "Should calculate power for positive base and exponent."
    },
    {
      "id": "test_025",
      "title": "Power with negative base and even exponent",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": -2, \"exponent\": 4}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": -2, \"exponent\": 4}, \"result\": 16}}",
      "description": "Should calculate power for negative base and even exponent."
    },
    {
      "id": "test_026",
      "title": "Power with negative base and odd exponent",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": -2, \"exponent\": 3}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": -2, \"exponent\": 3}, \"result\": -8}}",
      "description": "Should calculate power for negative base and odd exponent."
    },
    {
      "id": "test_027",
      "title": "Power with zero exponent",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": 5, \"exponent\": 0}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": 5, \"exponent\": 0}, \"result\": 1}}",
      "description": "Should return 1 for any non-zero base with zero exponent."
    },
    {
      "id": "test_028",
      "title": "Power with zero base and positive exponent",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": 0, \"exponent\": 5}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": 0, \"exponent\": 5}, \"result\": 0}}",
      "description": "Should return 0 for zero base and positive exponent."
    },
    {
      "id": "test_029",
      "title": "Power with zero base and zero exponent (Math.pow behavior)",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": 0, \"exponent\": 0}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": 0, \"exponent\": 0}, \"result\": 1}}",
      "description": "Should return 1 for 0^0, consistent with Math.pow."
    },
    {
      "id": "test_030",
      "title": "Power with large exponent, resulting in Infinity",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"base\": 2, \"exponent\": 1024}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"power\", \"operands\": {\"base\": 2, \"exponent\": 1024}, \"result\": \"Infinity\"}}",
      "description": "Should correctly handle large exponents resulting in Infinity."
    },
    {
      "id": "test_031",
      "title": "Power with missing 'base' parameter",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/power\", \"body\": {\"exponent\": 2}}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"Cả base và exponent phải là số\"}}",
      "description": "Should return 400 if 'base' is missing."
    },
    {
      "id": "test_032",
      "title": "Factorial of 0",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/0\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"factorial\", \"operand\": 0, \"result\": 1}}",
      "description": "Should return 1 for factorial of 0."
    },
    {
      "id": "test_033",
      "title": "Factorial of 1",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/1\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"factorial\", \"operand\": 1, \"result\": 1}}",
      "description": "Should return 1 for factorial of 1."
    },
    {
      "id": "test_034",
      "title": "Factorial of a positive integer (5)",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/5\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"factorial\", \"operand\": 5, \"result\": 120}}",
      "description": "Should correctly calculate factorial for a positive integer."
    },
    {
      "id": "test_035",
      "title": "Factorial of a negative integer",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/-5\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"n phải là số nguyên không âm\"}}",
      "description": "Should return 400 for a negative integer input."
    },
    {
      "id": "test_036",
      "title": "Factorial of a non-integer (decimal)",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/3.5\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"n phải là số nguyên không âm\"}}",
      "description": "Should return 400 for a non-integer (decimal) input."
    },
    {
      "id": "test_037",
      "title": "Factorial of a non-numeric string",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/abc\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"n phải là số nguyên không âm\"}}",
      "description": "Should return 400 for a non-numeric string input."
    },
    {
      "id": "test_038",
      "title": "Factorial of max allowed value (170)",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/170\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"factorial\", \"operand\": 170, \"result\": 7.257415615307994e+306}}",
      "description": "Should calculate factorial for the maximum allowed value (170). The result is a large float."
    },
    {
      "id": "test_039",
      "title": "Factorial of a number greater than 170",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/factorial/171\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Số quá lớn\", \"message\": \"n không được vượt quá 170 để tránh tràn số\"}}",
      "description": "Should return 400 for 'n' greater than 170 to prevent overflow."
    },
    {
      "id": "test_040",
      "title": "Fibonacci sequence for n=0",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/0\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"fibonacci\", \"operand\": 0, \"result\": [0], \"count\": 1}}",
      "description": "Should return [0] for n=0."
    },
    {
      "id": "test_041",
      "title": "Fibonacci sequence for n=1",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/1\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"fibonacci\", \"operand\": 1, \"result\": [0, 1], \"count\": 2}}",
      "description": "Should return [0, 1] for n=1."
    },
    {
      "id": "test_042",
      "title": "Fibonacci sequence for n=5",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/5\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"fibonacci\", \"operand\": 5, \"result\": [0, 1, 1, 2, 3, 5], \"count\": 6}}",
      "description": "Should return the correct Fibonacci sequence up to n=5."
    },
    {
      "id": "test_043",
      "title": "Fibonacci sequence for n=10",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/10\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"fibonacci\", \"operand\": 10, \"result\": [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55], \"count\": 11}}",
      "description": "Should return the correct Fibonacci sequence up to n=10."
    },
    {
      "id": "test_044",
      "title": "Fibonacci sequence for a negative integer",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/-5\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"n phải là số nguyên không âm\"}}",
      "description": "Should return 400 for a negative integer input for Fibonacci."
    },
    {
      "id": "test_045",
      "title": "Fibonacci sequence for a non-integer (decimal)",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/3.5\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"n phải là số nguyên không âm\"}}",
      "description": "Should return 400 for a non-integer (decimal) input for Fibonacci."
    },
    {
      "id": "test_046",
      "title": "Fibonacci sequence for a non-numeric string",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/xyz\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Tham số không hợp lệ\", \"message\": \"n phải là số nguyên không âm\"}}",
      "description": "Should return 400 for a non-numeric string input for Fibonacci."
    },
    {
      "id": "test_047",
      "title": "Fibonacci sequence for max allowed value (1000)",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/1000\"}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"fibonacci\", \"operand\": 1000, \"result\": \"[Array of 1001 numbers, first few: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ..., last: 4.346655768693743e+208]\", \"count\": 1001}}",
      "description": "Should return the Fibonacci sequence up to n=1000. The 'result' field is a string representation summarizing the actual array, which is too long to list explicitly. All numbers in the array for n=1000 should be finite, although some may have precision issues due to floating-point arithmetic."
    },
    {
      "id": "test_048",
      "title": "Fibonacci sequence for a number greater than 1000",
      "input": "{\"method\": \"GET\", \"path\": \"/api/math/fibonacci/1001\"}",
      "expected": "{\"statusCode\": 400, \"body\": {\"error\": \"Số quá lớn\", \"message\": \"n không được vượt quá 1000 để tránh timeout\"}}",
      "description": "Should return 400 for 'n' greater than 1000 to prevent overflow."
    },
    {
      "id": "test_049",
      "title": "Add with large numbers (potential precision issues)",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 9007199254740991, \"b\": 1}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": 9007199254740991, \"b\": 1}, \"result\": 9007199254740992}}",
      "description": "Should correctly add numbers near Number.MAX_SAFE_INTEGER."
    },
    {
      "id": "test_050",
      "title": "Add with numbers exceeding MAX_SAFE_INTEGER, potentially imprecise sum",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/add\", \"body\": {\"a\": 9007199254740991, \"b\": 2}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"addition\", \"operands\": {\"a\": 9007199254740991, \"b\": 2}, \"result\": 9007199254740993}}",
      "description": "Should return potentially imprecise sum for numbers exceeding MAX_SAFE_INTEGER, reflecting JS number behavior."
    },
    {
      "id": "test_051",
      "title": "Multiply with numbers exceeding MAX_VALUE, resulting in Infinity",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/multiply\", \"body\": {\"a\": 1.7976931348623157e+308, \"b\": 2}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"multiplication\", \"operands\": {\"a\": 1.7976931348623157e+308, \"b\": 2}, \"result\": \"Infinity\"}}",
      "description": "Should return Infinity when multiplication result exceeds Number.MAX_VALUE."
    },
    {
      "id": "test_052",
      "title": "Divide by a very small number, resulting in Infinity",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": 1, \"b\": 1e-324}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"division\", \"operands\": {\"a\": 1, \"b\": 1e-324}, \"result\": \"Infinity\"}}",
      "description": "Should return Infinity when dividing by a very small number (denormalized) resulting in overflow."
    },
    {
      "id": "test_053",
      "title": "Divide by a very large number, resulting in 0",
      "input": "{\"method\": \"POST\", \"path\": \"/api/math/divide\", \"body\": {\"a\": 1, \"b\": 1e+309}}",
      "expected": "{\"statusCode\": 200, \"body\": {\"operation\": \"division\", \"operands\": {\"a\": 1, \"b\": 1e+309}, \"result\": 0}}",
      "description": "Should return 0 when dividing by a very large number resulting in underflow."
    }
  ];

  testCases.forEach(testCase => {
    const parsedInput = JSON.parse(testCase.input);
    const parsedExpected = JSON.parse(testCase.expected);
    const expectedStatusCode = parsedExpected.statusCode;
    const expectedResultBody = parsedExpected.body;

    // Extract operation from path
    const operation = parsedInput.path.split('/').pop();

    it(`${testCase.id} - ${testCase.title}`, () => {
      if (expectedStatusCode === 200) {
        // Successful operation
        let result;
        if (['add', 'subtract', 'multiply', 'divide', 'power'].includes(operation)) {
          const { a, b, base, exponent } = parsedInput.body || {};
          if (operation === 'add') result = mathService.add(a, b);
          else if (operation === 'subtract') result = mathService.subtract(a, b);
          else if (operation === 'multiply') result = mathService.multiply(a, b);
          else if (operation === 'divide') result = mathService.divide(a, b);
          else if (operation === 'power') result = mathService.power(base, exponent);

          if (expectedResultBody.result === "Infinity") {
            expect(result).toBe(Infinity);
          } else if (expectedResultBody.result === "-Infinity") {
            expect(result).toBe(-Infinity);
          } else {
            expect(result).toBe(expectedResultBody.result);
          }

        } else if (operation === 'factorial') {
          const n = parseInt(parsedInput.path.split('/').pop());
          result = mathService.factorial(n);
          expect(result).toBe(expectedResultBody.result);
        } else if (operation === 'fibonacci') {
          const n = parseInt(parsedInput.path.split('/').pop());
          result = mathService.fibonacci(n);
          
          if (testCase.id === "test_047") { // Special handling for large fibonacci array summary
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(expectedResultBody.count);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(1);
            // Check that the last element is a finite number (or BigInt if supported by service)
            // Assuming the service returns standard JS numbers, large ones can be imprecise floats
            expect(Number.isFinite(result[result.length - 1]) || typeof result[result.length - 1] === 'bigint').toBe(true);
          } else {
            expect(result).toEqual(expectedResultBody.result);
          }
        }
      } else if (expectedStatusCode === 400) {
        // Error handling
        const expectedErrorMessage = expectedResultBody.message;
        expect(() => {
          if (['add', 'subtract', 'multiply', 'divide', 'power'].includes(operation)) {
            const { a, b, base, exponent } = parsedInput.body || {};
            if (operation === 'add') mathService.add(a, b);
            else if (operation === 'subtract') mathService.subtract(a, b);
            else if (operation === 'multiply') mathService.multiply(a, b);
            else if (operation === 'divide') mathService.divide(a, b);
            else if (operation === 'power') mathService.power(base, exponent);
          } else if (['factorial', 'fibonacci'].includes(operation)) {
            const nStr = parsedInput.path.split('/').pop(); // Pass string to allow service to validate type
            if (operation === 'factorial') mathService.factorial(nStr);
            else if (operation === 'fibonacci') mathService.fibonacci(nStr);
          }
        }).toThrow(expectedErrorMessage);
      }
    });
  });
});

// __tests__/stringService.test.js
const stringService = require('../services/stringService'); // Assuming stringService.js exports functions directly

describe('stringService', () => {

  const testCases = [
    {
      "id": "reverse_001",
      "title": "Reverse a standard string",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": "hello"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "hello",
          "result": "olleh"
        }
      },
      "description": "Should correctly reverse a simple lowercase string."
    },
    {
      "id": "reverse_002",
      "title": "Reverse a string with mixed case and spaces",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": "Hello World"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "Hello World",
          "result": "dlroW olleH"
        }
      },
      "description": "Should reverse a string preserving case and spaces."
    },
    {
      "id": "reverse_003",
      "title": "Reverse an empty string",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "",
          "result": ""
        }
      },
      "description": "Reversing an empty string should return an empty string."
    },
    {
      "id": "reverse_004",
      "title": "Reverse a single character string",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": "a"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "a",
          "result": "a"
        }
      },
      "description": "Reversing a single character string should return the same character."
    },
    {
      "id": "reverse_005",
      "title": "Reverse a string with special characters and numbers",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": "abc!@#123"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "abc!@#123",
          "result": "321#@!cba"
        }
      },
      "description": "Should correctly reverse a string containing special characters and numbers."
    },
    {
      "id": "reverse_006",
      "title": "Reverse a string with only spaces",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": "   "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "   ",
          "result": "   "
        }
      },
      "description": "Reversing a string of only spaces should return the same string of spaces."
    },
    {
      "id": "reverse_007",
      "title": "Reverse a string with unicode characters (emojis)",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": "😊🚀"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "reverse",
          "input": "😊🚀",
          "result": "🚀😊"
        }
      },
      "description": "Should correctly reverse strings with multi-byte Unicode characters like emojis."
    },
    {
      "id": "reverse_008",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing from the request body."
    },
    {
      "id": "reverse_009",
      "title": "Invalid input: 'text' is a number",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": 123
      },
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is not a string (e.g., a number)."
    },
    {
      "id": "reverse_010",
      "title": "Invalid input: 'text' is an object",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": {
          "value": "test"
        }
      },
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is not a string (e.g., an object)."
    },
    {
      "id": "reverse_011",
      "title": "Invalid input: 'text' is null",
      "endpoint": "/api/string/reverse",
      "method": "POST",
      "input": {
        "text": null
      },
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is null."
    },
    {
      "id": "uppercase_001",
      "title": "Convert a lowercase string to uppercase",
      "endpoint": "/api/string/uppercase",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "uppercase",
          "input": "hello world",
          "result": "HELLO WORLD"
        }
      },
      "description": "Should convert an all lowercase string to all uppercase."
    },
    {
      "id": "uppercase_002",
      "title": "Convert a mixed case string to uppercase",
      "endpoint": "/api/string/uppercase",
      "method": "POST",
      "input": {
        "text": "HeLlO wOrLd"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "uppercase",
          "input": "HeLlO wOrLd",
          "result": "HELLO WORLD"
        }
      },
      "description": "Should convert a mixed case string to all uppercase."
    },
    {
      "id": "uppercase_003",
      "title": "Convert an already uppercase string to uppercase",
      "endpoint": "/api/string/uppercase",
      "method": "POST",
      "input": {
        "text": "HELLO WORLD"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "uppercase",
          "input": "HELLO WORLD",
          "result": "HELLO WORLD"
        }
      },
      "description": "Converting an already uppercase string should return the same string."
    },
    {
      "id": "uppercase_004",
      "title": "Convert an empty string to uppercase",
      "endpoint": "/api/string/uppercase",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "uppercase",
          "input": "",
          "result": ""
        }
      },
      "description": "Converting an empty string should return an empty string."
    },
    {
      "id": "uppercase_005",
      "title": "Convert string with numbers and symbols to uppercase",
      "endpoint": "/api/string/uppercase",
      "method": "POST",
      "input": {
        "text": "123!@#abc"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "uppercase",
          "input": "123!@#abc",
          "result": "123!@#ABC"
        }
      },
      "description": "Numbers and symbols should remain unchanged when converting to uppercase."
    },
    {
      "id": "uppercase_006",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/uppercase",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for uppercase."
    },
    {
      "id": "lowercase_001",
      "title": "Convert an uppercase string to lowercase",
      "endpoint": "/api/string/lowercase",
      "method": "POST",
      "input": {
        "text": "HELLO WORLD"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "lowercase",
          "input": "HELLO WORLD",
          "result": "hello world"
        }
      },
      "description": "Should convert an all uppercase string to all lowercase."
    },
    {
      "id": "lowercase_002",
      "title": "Convert a mixed case string to lowercase",
      "endpoint": "/api/string/lowercase",
      "method": "POST",
      "input": {
        "text": "HeLlO wOrLd"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "lowercase",
          "input": "HeLlO wOrLd",
          "result": "hello world"
        }
      },
      "description": "Should convert a mixed case string to all lowercase."
    },
    {
      "id": "lowercase_003",
      "title": "Convert an already lowercase string to lowercase",
      "endpoint": "/api/string/lowercase",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "lowercase",
          "input": "hello world",
          "result": "hello world"
        }
      },
      "description": "Converting an already lowercase string should return the same string."
    },
    {
      "id": "lowercase_004",
      "title": "Convert an empty string to lowercase",
      "endpoint": "/api/string/lowercase",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "lowercase",
          "input": "",
          "result": ""
        }
      },
      "description": "Converting an empty string should return an empty string."
    },
    {
      "id": "lowercase_005",
      "title": "Convert string with numbers and symbols to lowercase",
      "endpoint": "/api/string/lowercase",
      "method": "POST",
      "input": {
        "text": "123!@#ABC"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "lowercase",
          "input": "123!@#ABC",
          "result": "123!@#abc"
        }
      },
      "description": "Numbers and symbols should remain unchanged when converting to lowercase."
    },
    {
      "id": "lowercase_006",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/lowercase",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for lowercase."
    },
    {
      "id": "wordcount_001",
      "title": "Count words in a standard sentence",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "Hello world, this is a test."
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "Hello world, this is a test.",
          "result": {
            "wordCount": 6,
            "words": [
              "Hello",
              "world,",
              "this",
              "is",
              "a",
              "test."
            ]
          }
        }
      },
      "description": "Should correctly count words, including punctuation attached to words."
    },
    {
      "id": "wordcount_002",
      "title": "Count words with multiple spaces between them",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "Hello   world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "Hello   world",
          "result": {
            "wordCount": 2,
            "words": [
              "Hello",
              "world"
            ]
          }
        }
      },
      "description": "Should treat multiple spaces between words as a single delimiter."
    },
    {
      "id": "wordcount_003",
      "title": "Count words with leading and trailing spaces",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "  Hello world  "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "  Hello world  ",
          "result": {
            ""wordCount": 2,
            "words": [
              "Hello",
              "world"
            ]
          }
        }
      },
      "description": "Should ignore leading and trailing spaces when counting words."
    },
    {
      "id": "wordcount_004",
      "title": "Count words in an empty string",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "",
          "result": {
            "wordCount": 0,
            "words": []
          }
        }
      },
      "description": "An empty string should result in a word count of 0."
    },
    {
      "id": "wordcount_005",
      "title": "Count words in a string with only spaces",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "   "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "   ",
          "result": {
            "wordCount": 0,
            "words": []
          }
        }
      },
      "description": "A string containing only spaces should result in a word count of 0."
    },
    {
      "id": "wordcount_006",
      "title": "Count words in a single word string",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "word"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "word",
          "result": {
            "wordCount": 1,
            "words": [
              "word"
            ]
          }
        }
      },
      "description": "A single word string should result in a word count of 1."
    },
    {
      "id": "wordcount_007",
      "title": "Count words with numbers and special characters",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "123 test! @#$"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "123 test! @#$",
          "result": {
            "wordCount": 3,
            "words": [
              "123",
              "test!",
              "@#$"
            ]
          }
        }
      },
      "description": "Numbers and special characters can be part of words."
    },
    {
      "id": "wordcount_008",
      "title": "Count words with various whitespace characters",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {
        "text": "word1\tword2\nword3"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "word-count",
          "input": "word1\tword2\nword3",
          "result": {
            "wordCount": 3,
            "words": [
              "word1",
              "word2",
              "word3"
            ]
          }
        }
      },
      "description": "Should handle different types of whitespace characters (spaces, tabs, newlines)."
    },
    {
      "id": "wordcount_009",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/word-count",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for word count."
    },
    {
      "id": "charcount_001",
      "title": "Count characters in a standard string",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {
        "text": "hello"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "char-count",
          "input": "hello",
          "result": {
            "totalCharacters": 5,
            "charactersWithoutSpaces": 5,
            "spaces": 0
          }
        }
      },
      "description": "Should correctly count characters in a string without spaces."
    },
    {
      "id": "charcount_002",
      "title": "Count characters in a string with spaces",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "char-count",
          "input": "hello world",
          "result": {
            "totalCharacters": 11,
            "charactersWithoutSpaces": 10,
            "spaces": 1
          }
        }
      },
      "description": "Should correctly count total characters and characters excluding spaces."
    },
    {
      "id": "charcount_003",
      "title": "Count characters in an empty string",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "char-count",
          "input": "",
          "result": {
            "totalCharacters": 0,
            "charactersWithoutSpaces": 0,
            "spaces": 0
          }
        }
      },
      "description": "An empty string should result in all character counts being 0."
    },
    {
      "id": "charcount_004",
      "title": "Count characters in a string with only spaces",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {
        "text": "   "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "char-count",
          "input": "   ",
          "result": {
            "totalCharacters": 3,
            "charactersWithoutSpaces": 0,
            "spaces": 3
          }
        }
      },
      "description": "A string of only spaces should have total characters equal to spaces, and 0 without spaces."
    },
    {
      "id": "charcount_005",
      "title": "Count characters with leading/trailing and multiple internal spaces",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {
        "text": "  hello   world  "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "char-count",
          "input": "  hello   world  ",
          "result": {
            "totalCharacters": 17,
            "charactersWithoutSpaces": 10,
            "spaces": 7
          }
        }
      },
      "description": "Should correctly count all types of spaces."
    },
    {
      "id": "charcount_006",
      "title": "Count characters including unicode (emojis)",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {
        "text": "😊🚀 text"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "char-count",
          "input": "😊🚀 text",
          "result": {
            "totalCharacters": 8,
            "charactersWithoutSpaces": 7,
            "spaces": 1
          }
        }
      },
      "description": "Should count multi-byte Unicode characters (like emojis) as single characters."
    },
    {
      "id": "charcount_007",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/char-count",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for character count."
    },
    {
      "id": "palindrome_001",
      "title": "Check a true palindrome (no spaces)",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "madam"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "madam",
          "result": {
            "isPalindrome": true,
            "cleanedText": "madam",
            "reversedText": "madam"
          }
        }
      },
      "description": "Should correctly identify a simple palindrome."
    },
    {
      "id": "palindrome_002",
      "title": "Check a true palindrome (with spaces and mixed case)",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "A man a plan a canal Panama"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "A man a plan a canal Panama",
          "result": {
            "isPalindrome": true,
            "cleanedText": "amanaplanacanalpanama",
            "reversedText": "amanaplanacanalpanama"
          }
        }
      },
      "description": "Should ignore spaces and case when checking for palindromes."
    },
    {
      "id": "palindrome_003",
      "title": "Check a false palindrome",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "hello world",
          "result": {
            "isPalindrome": false,
            "cleanedText": "helloworld",
            "reversedText": "dlrowolleh"
          }
        }
      },
      "description": "Should correctly identify a non-palindrome."
    },
    {
      "id": "palindrome_004",
      "title": "Check an empty string for palindrome",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "",
          "result": {
            "isPalindrome": true,
            "cleanedText": "",
            "reversedText": ""
          }
        }
      },
      "description": "An empty string is considered a palindrome."
    },
    {
      "id": "palindrome_005",
      "title": "Check a single character string for palindrome",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "a"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "a",
          "result": {
            "isPalindrome": true,
            "cleanedText": "a",
            "reversedText": "a"
          }
        }
      },
      "description": "A single character string is considered a palindrome."
    },
    {
      "id": "palindrome_006",
      "title": "Check a string with only spaces for palindrome",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "   "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "   ",
          "result": {
            "isPalindrome": true,
            "cleanedText": "",
            "reversedText": ""
          }
        }
      },
      "description": "A string containing only spaces should be cleaned to an empty string, which is a palindrome."
    },
    {
      "id": "palindrome_007",
      "title": "Check a palindrome with numbers and special characters (not ignored)",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "1a2a1"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "1a2a1",
          "result": {
            "isPalindrome": true,
            "cleanedText": "1a2a1",
            "reversedText": "1a2a1"
          }
        }
      },
      "description": "Numbers and non-space special characters are part of the palindrome check."
    },
    {
      "id": "palindrome_008",
      "title": "Check a palindrome with punctuation (not ignored)",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {
        "text": "No lemon, no melon."
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "palindrome",
          "input": "No lemon, no melon.",
          "result": {
            "isPalindrome": true,
            "cleanedText": "nolemonnomelon.",
            "reversedText": ".nolemonnomelon"
          }
        }
      },
      "description": "Punctuation is not removed by the current logic, so it affects palindrome check. This test shows a potential mismatch in 'expected' behavior if user expects punctuation removal."
    },
    {
      "id": "palindrome_009",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/palindrome",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for palindrome check."
    },
    {
      "id": "removespace_001",
      "title": "Remove all spaces from a standard string",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "hello world",
          "result": "helloworld"
        }
      },
      "description": "Should remove a single space between words."
    },
    {
      "id": "removespace_002",
      "title": "Remove all spaces from a string with leading/trailing spaces",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": "  hello world  "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "  hello world  ",
          "result": "helloworld"
        }
      },
      "description": "Should remove all leading, trailing, and internal spaces."
    },
    {
      "id": "removespace_003",
      "title": "Remove all spaces from a string with multiple internal spaces",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": "hello   world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "hello   world",
          "result": "helloworld"
        }
      },
      "description": "Should remove multiple spaces between words."
    },
    {
      "id": "removespace_004",
      "title": "Remove all spaces from an empty string",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "",
          "result": ""
        }
      },
      "description": "Removing spaces from an empty string should result in an empty string."
    },
    {
      "id": "removespace_005",
      "title": "Remove all spaces from a string with only spaces",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": "   "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "   ",
          "result": ""
        }
      },
      "description": "A string of only spaces should become an empty string after removing spaces."
    },
    {
      "id": "removespace_006",
      "title": "Remove all spaces from a string with no spaces",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": "helloworld"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "helloworld",
          "result": "helloworld"
        }
      },
      "description": "A string with no spaces should remain unchanged."
    },
    {
      "id": "removespace_007",
      "title": "Remove various whitespace characters",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {
        "text": "hello\tworld\n"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "remove-spaces",
          "input": "hello\tworld\n",
          "result": "helloworld"
        }
      },
      "description": "Should remove all types of whitespace characters (spaces, tabs, newlines)."
    },
    {
      "id": "removespace_008",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/remove-spaces",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for remove spaces."
    },
    {
      "id": "capitalize_001",
      "title": "Capitalize first letter of a lowercase string",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "hello world",
          "result": "Hello world"
        }
      },
      "description": "Should capitalize the first character and lowercase the rest of the string."
    },
    {
      "id": "capitalize_002",
      "title": "Capitalize first letter of an uppercase string",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": "HELLO WORLD"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "HELLO WORLD",
          "result": "Hello world"
        }
      },
      "description": "Should capitalize the first character and lowercase the rest, even if originally uppercase."
    },
    {
      "id": "capitalize_003",
      "title": "Capitalize first letter of a mixed case string",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": "hELLo wOrLD"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "hELLo wOrLD",
          "result": "Hello world"
        }
      },
      "description": "Should capitalize the first character and lowercase the rest, even if originally mixed case."
    },
    {
      "id": "capitalize_004",
      "title": "Capitalize an empty string",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "",
          "result": ""
        }
      },
      "description": "Capitalizing an empty string should result in an empty string."
    },
    {
      "id": "capitalize_005",
      "title": "Capitalize a single character string (lowercase)",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": "a"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "a",
          "result": "A"
        }
      },
      "description": "Should capitalize a single lowercase character."
    },
    {
      "id": "capitalize_006",
      "title": "Capitalize a single character string (uppercase)",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": "A"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "A",
          "result": "A"
        }
      },
      "description": "Should return an uppercase character if already uppercase."
    },
    {
      "id": "capitalize_007",
      "title": "Capitalize a string starting with a space",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": " hello"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": " hello",
          "result": " hello"
        }
      },
      "description": "If the string starts with a space, the space should remain, and the first actual character will not be capitalized."
    },
    {
      "id": "capitalize_008",
      "title": "Capitalize a string starting with a number or symbol",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {
        "text": "1hello"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "capitalize",
          "input": "1hello",
          "result": "1hello"
        }
      },
      "description": "Characters that are not letters should remain unchanged."
    },
    {
      "id": "capitalize_009",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/capitalize",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for capitalize."
    },
    {
      "id": "trim_001",
      "title": "Trim leading and trailing spaces from a string",
      "endpoint": "/api/string/trim",
      "method": "POST",
      "input": {
        "text": "  hello world  "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "trim",
          "input": "  hello world  ",
          "result": "hello world",
          "originalLength": 15,
          "trimmedLength": 11
        }
      },
      "description": "Should remove leading and trailing spaces, preserving internal spaces."
    },
    {
      "id": "trim_002",
      "title": "Trim an empty string",
      "endpoint": "/api/string/trim",
      "method": "POST",
      "input": {
        "text": ""
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "trim",
          "input": "",
          "result": "",
          "originalLength": 0,
          "trimmedLength": 0
        }
      },
      "description": "Trimming an empty string should result in an empty string."
    },
    {
      "id": "trim_003",
      "title": "Trim a string with no leading/trailing spaces",
      "endpoint": "/api/string/trim",
      "method": "POST",
      "input": {
        "text": "hello world"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "trim",
          "input": "hello world",
          "result": "hello world",
          "originalLength": 11,
          "trimmedLength": 11
        }
      },
      "description": "A string with no leading/trailing spaces should remain unchanged."
    },
    {
      "id": "trim_004",
      "title": "Trim a string with only spaces",
      "endpoint": "/api/string/trim",
      "method": "POST",
      "input": {
        "text": "   "
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "trim",
          "input": "   ",
          "result": "",
          "originalLength": 3,
          "trimmedLength": 0
        }
      },
      "description": "A string containing only spaces should become an empty string after trimming."
    },
    {
      "id": "trim_005",
      "title": "Trim a string with various whitespace characters",
      "endpoint": "/api/string/trim",
      "method": "POST",
      "input": {
        "text": "\t  hello world \n"
      },
      "expected": {
        "statusCode": 200,
        "body": {
          "operation": "trim",
          "input": "\t  hello world \n",
          "result": "hello world",
          "originalLength": 17,
          "trimmedLength": 11
        }
      },
      "description": "Should remove leading/trailing tabs and newlines as well as spaces."
    },
    {
      "id": "trim_006",
      "title": "Invalid input: 'text' parameter missing",
      "endpoint": "/api/string/trim",
      "method": "POST",
      "input": {},
      "expected": {
        "statusCode": 400,
        "body": {
          "error": "Tham số không hợp lệ",
          "message": "text phải là chuỗi"
        }
      },
      "description": "Should return 400 if 'text' parameter is missing for trim."
    }
  ];

  testCases.forEach(testCase => {
    const parsedInput = testCase.input;
    const parsedExpected = testCase.expected;
    const expectedStatusCode = parsedExpected.statusCode;
    const expectedResultBody = parsedExpected.body;

    // Extract operation from endpoint
    const operation = testCase.endpoint.split('/').pop();

    it(`${testCase.id} - ${testCase.title}`, () => {
      const { text } = parsedInput; // For string operations, input is always 'text'

      if (expectedStatusCode === 200) {
        let result;
        if (operation === 'reverse') {
          result = stringService.reverse(text);
          expect(result).toBe(expectedResultBody.result);
        } else if (operation === 'uppercase') {
          result = stringService.uppercase(text);
          expect(result).toBe(expectedResultBody.result);
        } else if (operation === 'lowercase') {
          result = stringService.lowercase(text);
          expect(result).toBe(expectedResultBody.result);
        } else if (operation === 'word-count') {
          result = stringService.wordCount(text);
          expect(result).toEqual(expectedResultBody.result);
        } else if (operation === 'char-count') {
          result = stringService.charCount(text);
          expect(result).toEqual(expectedResultBody.result);
        } else if (operation === 'palindrome') {
          result = stringService.palindrome(text);
          expect(result).toEqual(expectedResultBody.result);
        } else if (operation === 'capitalize') {
          result = stringService.capitalize(text);
          expect(result).toBe(expectedResultBody.result);
        } else if (operation === 'trim') {
          result = stringService.trim(text);
          expect(result).toEqual(expectedResultBody.result);
        }
      } else if (expectedStatusCode === 400) {
        const expectedErrorMessage = expectedResultBody.message;
        // Map operation name from URL to service function name (e.g., 'word-count' -> 'wordCount')
        const serviceFunctionName = operation.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        expect(() => stringService[serviceFunctionName](text)).toThrow(expectedErrorMessage);
      }
    });
  });
});

// __tests__/server.test.js
const request = require('supertest');
const app = require('../server'); // Assuming your Express app is exported from server.js

describe('API Endpoints (server.js)', () => {

  const testCases = [
    {
      "id": "app_001",
      "title": "GET / - Root endpoint returns welcome message and API endpoints",
      "input": {
        "method": "GET",
        "url": "/"
      },
      "expected": {
        "status": 200,
        "body": {
          "message": "Chào mừng đến với Express Math & String API!",
          "endpoints": {
            "math": {
              "add": "POST /api/math/add",
              "subtract": "POST /api/math/subtract",
              "multiply": "POST /api/math/multiply",
              "divide": "POST /api/math/divide",
              "power": "POST /api/math/power",
              "factorial": "GET /api/math/factorial/:n",
              "fibonacci": "GET /api/math/fibonacci/:n"
            },
            "string": {
              "reverse": "POST /api/string/reverse",
              "uppercase": "POST /api/string/uppercase",
              "lowercase": "POST /api/string/lowercase",
              "wordCount": "POST /api/string/word-count",
              "charCount": "POST /api/string/char-count",
              "palindrome": "POST /api/string/palindrome",
              "removeSpaces": "POST /api/string/remove-spaces"
            }
          }
        }
      },
      "description": "Verify that the root endpoint '/' correctly returns a welcome message and a list of available API endpoints."
    },
    {
      "id": "app_002",
      "title": "GET /non-existent-route - 404 Not Found for unknown endpoint",
      "input": {
        "method": "GET",
        "url": "/non-existent-route"
      },
      "expected": {
        "status": 404,
        "body": {
          "error": "Endpoint không tồn tại!",
          "message": "Vui lòng kiểm tra lại đường dẫn API"
        }
      },
      "description": "Verify that accessing an undefined route returns a 404 Not Found error with the expected error message."
    },
    {
      "id": "app_003",
      "title": "POST /api/math/add - Valid addition of two positive numbers",
      "input": {
        "method": "POST",
        "url": "/api/math/add",
        "body": {
          "num1": 5,
          "num2": 3
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 8
        }
      },
      "description": "Test addition of two positive integers via POST /api/math/add."
    },
    {
      "id": "app_004",
      "title": "POST /api/math/add - Addition with negative numbers and zero",
      "input": {
        "method": "POST",
        "url": "/api/math/add",
        "body": {
          "num1": -10,
          "num2": 5
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": -5
        }
      },
      "description": "Test addition with a negative and a positive number."
    },
    {
      "id": "app_005",
      "title": "POST /api/math/add - Addition with floating point numbers",
      "input": {
        "method": "POST",
        "url": "/api/math/add",
        "body": {
          "num1": 2.5,
          "num2": 3.7
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 6.2
        }
      },
      "description": "Test addition with floating point numbers."
    },
    {
      "id": "app_006",
      "title": "POST /api/math/add - Missing one parameter",
      "input": {
        "method": "POST",
        "url": "/api/math/add",
        "body": {
          "num1": 5
        }
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Both 'num1' and 'num2' are required and must be numbers."
        }
      },
      "description": "Verify error handling when 'num2' is missing for addition."
    },
    {
      "id": "app_007",
      "title": "POST /api/math/add - Invalid parameter type (string instead of number)",
      "input": {
        "method": "POST",
        "url": "/api/math/add",
        "body": {
          "num1": "hello",
          "num2": 3
        }
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Both 'num1' and 'num2' are required and must be numbers."
        }
      },
      "description": "Verify error handling when 'num1' is a string for addition."
    },
    {
      "id": "app_008",
      "title": "POST /api/math/subtract - Valid subtraction of two positive numbers",
      "input": {
        "method": "POST",
        "url": "/api/math/subtract",
        "body": {
          "num1": 10,
          "num2": 4
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 6
        }
      },
      "description": "Test subtraction of two positive integers."
    },
    {
      "id": "app_009",
      "title": "POST /api/math/subtract - Subtraction resulting in a negative number",
      "input": {
        "method": "POST",
        "url": "/api/math/subtract",
        "body": {
          "num1": 5,
          "num2": 10
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": -5
        }
      },
      "description": "Test subtraction where the result is negative."
    },
    {
      "id": "app_010",
      "title": "POST /api/math/subtract - Missing a parameter",
      "input": {
        "method": "POST",
        "url": "/api/math/subtract",
        "body": {
          "num2": 5
        }
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Both 'num1' and 'num2' are required and must be numbers."
        }
      },
      "description": "Verify error handling when 'num1' is missing for subtraction."
    },
    {
      "id": "app_011",
      "title": "POST /api/math/multiply - Valid multiplication",
      "input": {
        "method": "POST",
        "url": "/api/math/multiply",
        "body": {
          "num1": 6,
          "num2": 7
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 42
        }
      },
      "description": "Test multiplication of two positive integers."
    },
    {
      "id": "app_012",
      "title": "POST /api/math/multiply - Multiplication by zero",
      "input": {
        "method": "POST",
        "url": "/api/math/multiply",
        "body": {
          "num1": 100,
          "num2": 0
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 0
        }
      },
      "description": "Test multiplication of a number by zero."
    },
    {
      "id": "app_013",
      "title": "POST /api/math/divide - Valid division",
      "input": {
        "method": "POST",
        "url": "/api/math/divide",
        "body": {
          "num1": 10,
          "num2": 2
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 5
        }
      },
      "description": "Test division of two positive integers."
    },
    {
      "id": "app_014",
      "title": "POST /api/math/divide - Division by zero",
      "input": {
        "method": "POST",
        "url": "/api/math/divide",
        "body": {
          "num1": 10,
          "num2": 0
        }
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Cannot divide by zero."
        }
      },
      "description": "Verify error handling for division by zero."
    },
    {
      "id": "app_015",
      "title": "POST /api/math/divide - Zero divided by a number",
      "input": {
        "method": "POST",
        "url": "/api/math/divide",
        "body": {
          "num1": 0,
          "num2": 5
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 0
        }
      },
      "description": "Test division of zero by a non-zero number."
    },
    {
      "id": "app_016",
      "title": "POST /api/math/power - Positive base, positive exponent",
      "input": {
        "method": "POST",
        "url": "/api/math/power",
        "body": {
          "base": 2,
          "exponent": 3
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 8
        }
      },
      "description": "Test power function with a positive base and positive exponent."
    },
    {
      "id": "app_017",
      "title": "POST /api/math/power - Positive base, zero exponent",
      "input": {
        "method": "POST",
        "url": "/api/math/power",
        "body": {
          "base": 5,
          "exponent": 0
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 1
        }
      },
      "description": "Test power function with a positive base and zero exponent (result should be 1)."
    },
    {
      "id": "app_018",
      "title": "POST /api/math/power - Negative base, even exponent",
      "input": {
        "method": "POST",
        "url": "/api/math/power",
        "body": {
          "base": -2,
          "exponent": 2
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 4
        }
      },
      "description": "Test power function with a negative base and an even exponent."
    },
    {
      "id": "app_019",
      "title": "POST /api/math/power - Missing base parameter",
      "input": {
        "method": "POST",
        "url": "/api/math/power",
        "body": {
          "exponent": 2
        }
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Both 'base' and 'exponent' are required and must be numbers."
        }
      },
      "description": "Verify error handling when 'base' is missing for power function."
    },
    {
      "id": "app_020",
      "title": "GET /api/math/factorial/5 - Valid factorial calculation",
      "input": {
        "method": "GET",
        "url": "/api/math/factorial/5"
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 120
        }
      },
      "description": "Test factorial calculation for a positive integer (5!)."
    },
    {
      "id": "app_021",
      "title": "GET /api/math/factorial/0 - Factorial of zero",
      "input": {
        "method": "GET",
        "url": "/api/math/factorial/0"
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 1
        }
      },
      "description": "Test factorial calculation for zero (0! = 1)."
    },
    {
      "id": "app_022",
      "title": "GET /api/math/factorial/-3 - Factorial of a negative number",
      "input": {
        "method": "GET",
        "url": "/api/math/factorial/-3"
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Number must be a non-negative integer for factorial."
        }
      },
      "description": "Verify error handling for factorial of a negative number."
    },
    {
      "id": "app_023",
      "title": "GET /api/math/factorial/abc - Factorial with non-numeric input",
      "input": {
        "method": "GET",
        "url": "/api/math/factorial/abc"
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Number must be a non-negative integer for factorial."
        }
      },
      "description": "Verify error handling for factorial with non-numeric path parameter."
    },
    {
      "id": "app_024",
      "title": "GET /api/math/fibonacci/6 - Valid Fibonacci sequence calculation",
      "input": {
        "method": "GET",
        "url": "/api/math/fibonacci/6"
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 8
        }
      },
      "description": "Test Fibonacci sequence calculation for n=6 (F(6)=8)."
    },
    {
      "id": "app_025",
      "title": "GET /api/math/fibonacci/0 - Fibonacci of zero",
      "input": {
        "method": "GET",
        "url": "/api/math/fibonacci/0"
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 0
        }
      },
      "description": "Test Fibonacci sequence calculation for n=0 (F(0)=0)."
    },
    {
      "id": "app_026",
      "title": "GET /api/math/fibonacci/1 - Fibonacci of one",
      "input": {
        "method": "GET",
        "url": "/api/math/fibonacci/1"
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 1
        }
      },
      "description": "Test Fibonacci sequence calculation for n=1 (F(1)=1)."
    },
    {
      "id": "app_027",
      "title": "GET /api/math/fibonacci/-5 - Fibonacci of a negative number",
      "input": {
        "method": "GET",
        "url": "/api/math/fibonacci/-5"
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Number must be a non-negative integer for fibonacci."
        }
      },
      "description": "Verify error handling for Fibonacci of a negative number."
    },
    {
      "id": "app_028",
      "title": "POST /api/string/reverse - Reverse a normal string",
      "input": {
        "method": "POST",
        "url": "/api/string/reverse",
        "body": {
          "text": "hello"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "olleh"
        }
      },
      "description": "Test reversing a simple string."
    },
    {
      "id": "app_029",
      "title": "POST /api/string/reverse - Reverse an empty string",
      "input": {
        "method": "POST",
        "url": "/api/string/reverse",
        "body": {
          "text": ""
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": ""
        }
      },
      "description": "Test reversing an empty string."
    },
    {
      "id": "app_030",
      "title": "POST /api/string/reverse - Reverse a string with spaces and special characters",
      "input": {
        "method": "POST",
        "url": "/api/string/reverse",
        "body": {
          "text": "Hello World!"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "!dlroW olleH"
        }
      },
      "description": "Test reversing a string including spaces and special characters."
    },
    {
      "id": "app_031",
      "title": "POST /api/string/reverse - Missing 'text' parameter",
      "input": {
        "method": "POST",
        "url": "/api/string/reverse",
        "body": {}
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Text parameter is required and must be a string."
        }
      },
      "description": "Verify error handling when 'text' parameter is missing for string reverse."
    },
    {
      "id": "app_032",
      "title": "POST /api/string/uppercase - Convert string to uppercase",
      "input": {
        "method": "POST",
        "url": "/api/string/uppercase",
        "body": {
          "text": "hello world"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "HELLO WORLD"
        }
      },
      "description": "Test converting a lowercase string to uppercase."
    },
    {
      "id": "app_033",
      "title": "POST /api/string/uppercase - Convert mixed case string to uppercase",
      "input": {
        "method": "POST",
        "url": "/api/string/uppercase",
        "body": {
          "text": "HeLlO WoRlD"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "HELLO WORLD"
        }
      },
      "description": "Test converting a mixed-case string to uppercase."
    },
    {
      "id": "app_034",
      "title": "POST /api/string/lowercase - Convert string to lowercase",
      "input": {
        "method": "POST",
        "url": "/api/string/lowercase",
        "body": {
          "text": "HELLO WORLD"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "hello world"
        }
      },
      "description": "Test converting an uppercase string to lowercase."
    },
    {
      "id": "app_035",
      "title": "POST /api/string/word-count - Count words in a sentence",
      "input": {
        "method": "POST",
        "url": "/api/string/word-count",
        "body": {
          "text": "This is a test sentence."
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 5
        }
      },
      "description": "Test counting words in a standard sentence."
    },
    {
      "id": "app_036",
      "title": "POST /api/string/word-count - Count words in an empty string",
      "input": {
        "method": "POST",
        "url": "/api/string/word-count",
        "body": {
          "text": ""
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 0
        }
      },
      "description": "Test counting words in an empty string (should be 0)."
    },
    {
      "id": "app_037",
      "title": "POST /api/string/word-count - Count words with multiple spaces and leading/trailing spaces",
      "input": {
        "method": "POST",
        "url": "/api/string/word-count",
        "body": {
          "text": "  Hello   World   "
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 2
        }
      },
      "description": "Test counting words with extra spaces, leading, and trailing spaces."
    },
    {
      "id": "app_038",
      "title": "POST /api/string/char-count - Count characters in a string",
      "input": {
        "method": "POST",
        "url": "/api/string/char-count",
        "body": {
          "text": "hello world"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 11
        }
      },
      "description": "Test counting characters in a string including spaces."
    },
    {
      "id": "app_039",
      "title": "POST /api/string/char-count - Count characters in an empty string",
      "input": {
        "method": "POST",
        "url": "/api/string/char-count",
        "body": {
          "text": ""
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": 0
        }
      },
      "description": "Test counting characters in an empty string."
    },
    {
      "id": "app_040",
      "title": "POST /api/string/palindrome - Check a true palindrome (odd length)",
      "input": {
        "method": "POST",
        "url": "/api/string/palindrome",
        "body": {
          "text": "madam"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": true
        }
      },
      "description": "Test if 'madam' is a palindrome."
    },
    {
      "id": "app_041",
      "title": "POST /api/string/palindrome - Check a true palindrome (even length)",
      "input": {
        "method": "POST",
        "url": "/api/string/palindrome",
        "body": {
          "text": "racecar"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": true
        }
      },
      "description": "Test if 'racecar' is a palindrome (even length, after processing)."
    },
    {
      "id": "app_042",
      "title": "POST /api/string/palindrome - Check a false palindrome",
      "input": {
        "method": "POST",
        "url": "/api/string/palindrome",
        "body": {
          "text": "hello"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": false
        }
      },
      "description": "Test if 'hello' is a palindrome (should be false)."
    },
    {
      "id": "app_043",
      "title": "POST /api/string/palindrome - Check palindrome with spaces and mixed case (case/space insensitive)",
      "input": {
        "method": "POST",
        "url": "/api/string/palindrome",
        "body": {
          "text": "A man a plan a canal Panama"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": true
        }
      },
      "description": "Test a complex palindrome, assuming case-insensitive and space-ignoring comparison."
    },
    {
      "id": "app_044",
      "title": "POST /api/string/remove-spaces - Remove all spaces from a string",
      "input": {
        "method": "POST",
        "url": "/api/string/remove-spaces",
        "body": {
          "text": "  Hello   World   "
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "HelloWorld"
        }
      },
      "description": "Test removing all spaces (leading, trailing, multiple internal) from a string."
    },
    {
      "id": "app_045",
      "title": "POST /api/string/remove-spaces - Remove spaces from a string with no spaces",
      "input": {
        "method": "POST",
        "url": "/api/string/remove-spaces",
        "body": {
          "text": "NoSpaces"
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": "NoSpaces"
        }
      },
      "description": "Test removing spaces from a string that already has no spaces."
    },
    {
      "id": "app_046",
      "title": "POST /api/string/remove-spaces - Remove spaces from an empty string",
      "input": {
        "method": "POST",
        "url": "/api/string/remove-spaces",
        "body": {
          "text": ""
        }
      },
      "expected": {
        "status": 200,
        "body": {
          "result": ""
        }
      },
      "description": "Test removing spaces from an empty string."
    },
    {
      "id": "app_047",
      "title": "POST /api/string/remove-spaces - Missing 'text' parameter",
      "input": {
        "method": "POST",
        "url": "/api/string/remove-spaces",
        "body": {}
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid input",
          "message": "Text parameter is required and must be a string."
        }
      },
      "description": "Verify error handling when 'text' parameter is missing for remove spaces."
    },
    {
      "id": "app_048",
      "title": "POST /api/math/add - Invalid JSON body format",
      "input": {
        "method": "POST",
        "url": "/api/math/add",
        "body": "{ invalid json"
      },
      "expected": {
        "status": 400,
        "body": {
          "error": "Invalid JSON payload",
          "message": "Unexpected token i in JSON at position 2"
        }
      },
      "description": "Verify the Express global error handler catches invalid JSON body parsing errors."
    },
    {
      "id": "app_049",
      "title": "Middleware - CORS headers are set (preflight OPTIONS request)",
      "input": {
        "method": "OPTIONS",
        "url": "/api/math/add",
        "headers": {
          "Origin": "http://example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type"
        }
      },
      "expected": {
        "status": 204,
        "headers": {
          "Access-Control-Allow-Origin": "http://example.com",
          "Access-Control-Allow-Methods": "POST,GET,HEAD,PUT,PATCH,DELETE",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      },
      "description": "Verify CORS middleware handles preflight OPTIONS requests correctly."
    },
    {
      "id": "app_050",
      "title": "Middleware - CORS headers are set (simple GET request)",
      "input": {
        "method": "GET",
        "url": "/",
        "headers": {
          "Origin": "http://example.com"
        }
      },
      "expected": {
        "status": 200,
        "headers": {
          "Access-Control-Allow-Origin": "http://example.com"
        },
        "body": {
          "message": "Chào mừng đến với Express Math & String API!",
          "endpoints": {
            "math": {
              "add": "POST /api/math/add",
              "subtract": "POST /api/math/subtract",
              "multiply": "POST /api/math/multiply",
              "divide": "POST /api/math/divide",
              "power": "POST /api/math/power",
              "factorial": "GET /api/math/factorial/:n",
              "fibonacci": "GET /api/math/fibonacci/:n"
            },
            "string": {
              "reverse": "POST /api/string/reverse",
              "uppercase": "POST /api/string/uppercase",
              "lowercase": "POST /api/string/lowercase",
              "wordCount": "POST /api/string/word-count",
              "charCount": "POST /api/string/char-count",
              "palindrome": "POST /api/string/palindrome",
              "removeSpaces": "POST /api/string/remove-spaces"
            }
          }
        }
      },
      "description": "Verify CORS middleware adds Access-Control-Allow-Origin header for simple GET requests."
    }
  ];

  testCases.forEach(testCase => {
    const { method, url, body, headers } = testCase.input;
    const { status: expectedStatus, body: expectedBody, headers: expectedHeaders } = testCase.expected;

    it(`${testCase.id} - ${testCase.title}`, async () => {
      let req = request(app)[method.toLowerCase()](url);

      if (headers) {
        for (const headerName in headers) {
          req = req.set(headerName, headers[headerName]);
        }
      }

      // Special handling for malformed JSON body (app_048) or non-JSON body (test_056, assuming it's for server.js)
      if (typeof body === 'string' && headers && headers['Content-Type'] === 'application/json') {
          // supertest's .send() automatically stringifies objects.
          // To send a raw malformed string with Content-Type: application/json,
          // we need to explicitly set the header and then send the raw string.
          req = req.set('Content-Type', 'application/json').send(body);
      } else if (body) {
          req = req.send(body);
      }

      const res = await req.expect(expectedStatus);

      if (expectedBody) {
        // For app_048, the error message from Express body-parser might vary slightly,
        // so we check if it contains the expected message.
        if (testCase.id === "app_048") {
            expect(res.body.error).toBe(expectedBody.error);
            expect(res.body.message).toContain(expectedBody.message);
        } else {
            expect(res.body).toEqual(expectedBody);
        }
      }

      if (expectedHeaders) {
        for (const headerName in expectedHeaders) {
          // Supertest converts response headers to lowercase
          expect(res.headers[headerName.toLowerCase()]).toBe(expectedHeaders[headerName]);
        }
      }
    });
  });
});