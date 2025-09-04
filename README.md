# Express Math & String API

Một ứng dụng Express.js đơn giản cung cấp các API cho các phép toán học cơ bản và xử lý chuỗi.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy ứng dụng:
```bash
# Chạy bình thường
npm start

# Chạy với nodemon (tự động restart khi có thay đổi)
npm run dev
```

3. Ứng dụng sẽ chạy tại: `http://localhost:3000`

## API Endpoints

### Math APIs (`/api/math/`)

#### 1. Cộng hai số
- **POST** `/api/math/add`
- **Body**: `{ "a": 5, "b": 3 }`
- **Response**: `{ "operation": "addition", "operands": { "a": 5, "b": 3 }, "result": 8 }`

#### 2. Trừ hai số
- **POST** `/api/math/subtract`
- **Body**: `{ "a": 10, "b": 3 }`
- **Response**: `{ "operation": "subtraction", "operands": { "a": 10, "b": 3 }, "result": 7 }`

#### 3. Nhân hai số
- **POST** `/api/math/multiply`
- **Body**: `{ "a": 4, "b": 5 }`
- **Response**: `{ "operation": "multiplication", "operands": { "a": 4, "b": 5 }, "result": 20 }`

#### 4. Chia hai số
- **POST** `/api/math/divide`
- **Body**: `{ "a": 15, "b": 3 }`
- **Response**: `{ "operation": "division", "operands": { "a": 15, "b": 3 }, "result": 5 }`

#### 5. Lũy thừa
- **POST** `/api/math/power`
- **Body**: `{ "base": 2, "exponent": 3 }`
- **Response**: `{ "operation": "power", "operands": { "base": 2, "exponent": 3 }, "result": 8 }`

#### 6. Giai thừa
- **GET** `/api/math/factorial/5`
- **Response**: `{ "operation": "factorial", "operand": 5, "result": 120 }`

#### 7. Dãy Fibonacci
- **GET** `/api/math/fibonacci/10`
- **Response**: `{ "operation": "fibonacci", "operand": 10, "result": [0,1,1,2,3,5,8,13,21,34,55], "count": 11 }`

### String APIs (`/api/string/`)

#### 1. Đảo ngược chuỗi
- **POST** `/api/string/reverse`
- **Body**: `{ "text": "Hello World" }`
- **Response**: `{ "operation": "reverse", "input": "Hello World", "result": "dlroW olleH" }`

#### 2. Chuyển thành chữ hoa
- **POST** `/api/string/uppercase`
- **Body**: `{ "text": "hello world" }`
- **Response**: `{ "operation": "uppercase", "input": "hello world", "result": "HELLO WORLD" }`

#### 3. Chuyển thành chữ thường
- **POST** `/api/string/lowercase`
- **Body**: `{ "text": "HELLO WORLD" }`
- **Response**: `{ "operation": "lowercase", "input": "HELLO WORLD", "result": "hello world" }`

#### 4. Đếm số từ
- **POST** `/api/string/word-count`
- **Body**: `{ "text": "Hello world from API" }`
- **Response**: `{ "operation": "word-count", "input": "Hello world from API", "result": { "wordCount": 4, "words": ["Hello", "world", "from", "API"] } }`

#### 5. Đếm số ký tự
- **POST** `/api/string/char-count`
- **Body**: `{ "text": "Hello World" }`
- **Response**: `{ "operation": "char-count", "input": "Hello World", "result": { "totalCharacters": 11, "charactersWithoutSpaces": 10, "spaces": 1 } }`

#### 6. Kiểm tra chuỗi đối xứng
- **POST** `/api/string/palindrome`
- **Body**: `{ "text": "racecar" }`
- **Response**: `{ "operation": "palindrome", "input": "racecar", "result": { "isPalindrome": true, "cleanedText": "racecar", "reversedText": "racecar" } }`

#### 7. Loại bỏ khoảng trắng
- **POST** `/api/string/remove-spaces`
- **Body**: `{ "text": "Hello World" }`
- **Response**: `{ "operation": "remove-spaces", "input": "Hello World", "result": "HelloWorld" }`

#### 8. Viết hoa chữ cái đầu
- **POST** `/api/string/capitalize`
- **Body**: `{ "text": "hello world" }`
- **Response**: `{ "operation": "capitalize", "input": "hello world", "result": "Hello world" }`

#### 9. Loại bỏ khoảng trắng đầu cuối
- **POST** `/api/string/trim`
- **Body**: `{ "text": "  hello world  " }`
- **Response**: `{ "operation": "trim", "input": "  hello world  ", "result": "hello world", "originalLength": 15, "trimmedLength": 11 }`

## Ví dụ sử dụng với cURL

### Math APIs
```bash
# Cộng hai số
curl -X POST http://localhost:3000/api/math/add \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3}'

# Tính giai thừa
curl http://localhost:3000/api/math/factorial/5

# Dãy Fibonacci
curl http://localhost:3000/api/math/fibonacci/10
```

### String APIs
```bash
# Đảo ngược chuỗi
curl -X POST http://localhost:3000/api/string/reverse \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World"}'

# Đếm từ
curl -X POST http://localhost:3000/api/string/word-count \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world from API"}'

# Kiểm tra chuỗi đối xứng
curl -X POST http://localhost:3000/api/string/palindrome \
  -H "Content-Type: application/json" \
  -d '{"text": "racecar"}'
```

## Cấu trúc dự án

```
DemoJS/
├── services/
│   ├── mathService.js      # Các API toán học
│   └── stringService.js    # Các API xử lý chuỗi
├── server.js               # File chính của Express app
├── package.json            # Dependencies và scripts
└── README.md              # Hướng dẫn sử dụng
```

## Dependencies

- **express**: Framework web cho Node.js
- **cors**: Middleware để xử lý CORS
- **nodemon**: Tool để tự động restart server khi có thay đổi (dev dependency)

## Lưu ý

- Tất cả API đều có xử lý lỗi và validation đầu vào
- Server chạy trên port 3000 mặc định (có thể thay đổi bằng biến môi trường PORT)
- API trả về response dạng JSON với thông tin chi tiết về operation và kết quả
