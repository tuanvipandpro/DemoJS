const express = require('express');
const router = express.Router();

// POST /api/math/add - Cộng hai số
router.post('/add', (req, res) => {
  try {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số'
      });
    }
    
    const result = a + b;
    res.json({
      operation: 'addition',
      operands: { a, b },
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi thực hiện phép cộng',
      message: error.message
    });
  }
});

// POST /api/math/subtract - Trừ hai số
router.post('/subtract', (req, res) => {
  try {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số'
      });
    }
    
    const result = a - b;
    res.json({
      operation: 'subtraction',
      operands: { a, b },
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi thực hiện phép trừ',
      message: error.message
    });
  }
});

// POST /api/math/multiply - Nhân hai số
router.post('/multiply', (req, res) => {
  try {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số'
      });
    }
    
    const result = a * b;
    res.json({
      operation: 'multiplication',
      operands: { a, b },
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi thực hiện phép nhân',
      message: error.message
    });
  }
});

// POST /api/math/divide - Chia hai số
router.post('/divide', (req, res) => {
  try {
    const { a, b } = req.body;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'Cả a và b phải là số'
      });
    }
    
    if (b === 0) {
      return res.status(400).json({
        error: 'Lỗi chia cho 0',
        message: 'Không thể chia cho 0'
      });
    }
    
    const result = a / b;
    res.json({
      operation: 'division',
      operands: { a, b },
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi thực hiện phép chia',
      message: error.message
    });
  }
});

// POST /api/math/power - Lũy thừa
router.post('/power', (req, res) => {
  try {
    const { base, exponent } = req.body;
    
    if (typeof base !== 'number' || typeof exponent !== 'number') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'Cả base và exponent phải là số'
      });
    }
    
    const result = Math.pow(base, exponent);
    res.json({
      operation: 'power',
      operands: { base, exponent },
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi thực hiện phép lũy thừa',
      message: error.message
    });
  }
});

// GET /api/math/factorial/:n - Giai thừa
router.get('/factorial/:n', (req, res) => {
  try {
    const n = parseInt(req.params.n);
    
    if (isNaN(n) || n < 0) {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm'
      });
    }
    
    if (n > 170) {
      return res.status(400).json({
        error: 'Số quá lớn',
        message: 'n không được vượt quá 170 để tránh tràn số'
      });
    }
    
    function factorial(num) {
      if (num === 0 || num === 1) return 1;
      return num * factorial(num - 1);
    }
    
    const result = factorial(n);
    res.json({
      operation: 'factorial',
      operand: n,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi tính giai thừa',
      message: error.message
    });
  }
});

// GET /api/math/fibonacci/:n - Dãy Fibonacci
router.get('/fibonacci/:n', (req, res) => {
  try {
    const n = parseInt(req.params.n);
    
    if (isNaN(n) || n < 0) {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'n phải là số nguyên không âm'
      });
    }
    
    if (n > 1000) {
      return res.status(400).json({
        error: 'Số quá lớn',
        message: 'n không được vượt quá 1000 để tránh timeout'
      });
    }
    
    function fibonacci(num) {
      if (num === 0) return [0];
      if (num === 1) return [0, 1];
      
      const fib = [0, 1];
      for (let i = 2; i <= num; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
      }
      return fib;
    }
    
    const result = fibonacci(n);
    res.json({
      operation: 'fibonacci',
      operand: n,
      result: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi tính dãy Fibonacci',
      message: error.message
    });
  }
});

module.exports = router;
