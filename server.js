const express = require('express');
const cors = require('cors');
const mathService = require('./services/mathService');
const stringService = require('./services/stringService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes cho Math Service
app.use('/api/math', mathService);

// Routes cho String Service
app.use('/api/string', stringService);

// Route chính
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với Express Math & String API!',
    endpoints: {
      math: {
        add: 'POST /api/math/add',
        subtract: 'POST /api/math/subtract',
        multiply: 'POST /api/math/multiply',
        divide: 'POST /api/math/divide',
        power: 'POST /api/math/power',
        factorial: 'GET /api/math/factorial/:n',
        fibonacci: 'GET /api/math/fibonacci/:n'
      },
      string: {
        reverse: 'POST /api/string/reverse',
        uppercase: 'POST /api/string/uppercase',
        lowercase: 'POST /api/string/lowercase',
        wordCount: 'POST /api/string/word-count',
        charCount: 'POST /api/string/char-count',
        palindrome: 'POST /api/string/palindrome',
        removeSpaces: 'POST /api/string/remove-spaces'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Có lỗi xảy ra trên server!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint không tồn tại!',
    message: 'Vui lòng kiểm tra lại đường dẫn API'
  });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log('Các API có sẵn:');
  console.log('- Math APIs: /api/math/*');
  console.log('- String APIs: /api/string/*');
});
