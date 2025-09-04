const express = require('express');
const router = express.Router();

// POST /api/string/reverse - Đảo ngược chuỗi
router.post('/reverse', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const result = text.split('').reverse().join('');
    res.json({
      operation: 'reverse',
      input: text,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi đảo ngược chuỗi',
      message: error.message
    });
  }
});

// POST /api/string/uppercase - Chuyển thành chữ hoa
router.post('/uppercase', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const result = text.toUpperCase();
    res.json({
      operation: 'uppercase',
      input: text,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi chuyển thành chữ hoa',
      message: error.message
    });
  }
});

// POST /api/string/lowercase - Chuyển thành chữ thường
router.post('/lowercase', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const result = text.toLowerCase();
    res.json({
      operation: 'lowercase',
      input: text,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi chuyển thành chữ thường',
      message: error.message
    });
  }
});

// POST /api/string/word-count - Đếm số từ
router.post('/word-count', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    // Loại bỏ khoảng trắng thừa và chia thành từ
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    res.json({
      operation: 'word-count',
      input: text,
      result: {
        wordCount: wordCount,
        words: words
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi đếm từ',
      message: error.message
    });
  }
});

// POST /api/string/char-count - Đếm số ký tự
router.post('/char-count', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s/g, '').length;
    
    res.json({
      operation: 'char-count',
      input: text,
      result: {
        totalCharacters: charCount,
        charactersWithoutSpaces: charCountNoSpaces,
        spaces: charCount - charCountNoSpaces
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi đếm ký tự',
      message: error.message
    });
  }
});

// POST /api/string/palindrome - Kiểm tra chuỗi đối xứng
router.post('/palindrome', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    // Loại bỏ khoảng trắng và chuyển thành chữ thường
    const cleanedText = text.replace(/\s/g, '').toLowerCase();
    const reversedText = cleanedText.split('').reverse().join('');
    const isPalindrome = cleanedText === reversedText;
    
    res.json({
      operation: 'palindrome',
      input: text,
      result: {
        isPalindrome: isPalindrome,
        cleanedText: cleanedText,
        reversedText: reversedText
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi kiểm tra chuỗi đối xứng',
      message: error.message
    });
  }
});

// POST /api/string/remove-spaces - Loại bỏ khoảng trắng
router.post('/remove-spaces', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const result = text.replace(/\s/g, '');
    res.json({
      operation: 'remove-spaces',
      input: text,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi loại bỏ khoảng trắng',
      message: error.message
    });
  }
});

// POST /api/string/capitalize - Viết hoa chữ cái đầu
router.post('/capitalize', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    res.json({
      operation: 'capitalize',
      input: text,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi viết hoa chữ cái đầu',
      message: error.message
    });
  }
});

// POST /api/string/trim - Loại bỏ khoảng trắng đầu và cuối
router.post('/trim', (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        message: 'text phải là chuỗi'
      });
    }
    
    const result = text.trim();
    res.json({
      operation: 'trim',
      input: text,
      result: result,
      originalLength: text.length,
      trimmedLength: result.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi loại bỏ khoảng trắng đầu cuối',
      message: error.message
    });
  }
});

module.exports = router;
