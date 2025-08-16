import crypto from 'crypto';

// Trong production, sử dụng environment variable cho secret key
// AES-256-CBC yêu cầu key dài 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Mã hóa Personal Access Token trước khi lưu vào database
 * @param {string} token - Token cần mã hóa
 * @returns {string} - Token đã mã hóa (base64)
 */
export function encryptToken(token) {
  if (!token) return null;
  
  try {
    // Đảm bảo key có đủ độ dài 32 bytes
    let key = ENCRYPTION_KEY;
    if (key.length < 32) {
      // Pad key với '!' nếu quá ngắn
      key = key.padEnd(32, '!');
    } else if (key.length > 32) {
      // Cắt key nếu quá dài
      key = key.substring(0, 32);
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Trả về IV + encrypted data dưới dạng base64
    return Buffer.concat([iv, Buffer.from(encrypted, 'hex')]).toString('base64');
  } catch (error) {
    console.error('Error encrypting token:', error);
    return null;
  }
}

/**
 * Giải mã Personal Access Token từ database
 * @param {string} encryptedToken - Token đã mã hóa
 * @returns {string} - Token gốc
 */
export function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;
  
  try {
    // Đảm bảo key có đủ độ dài 32 bytes
    let key = ENCRYPTION_KEY;
    if (key.length < 32) {
      // Pad key với '!' nếu quá ngắn
      key = key.padEnd(32, '!');
    } else if (key.length > 32) {
      // Cắt key nếu quá dài
      key = key.substring(0, 32);
    }
    
    const data = Buffer.from(encryptedToken, 'base64');
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16).toString('hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting token:', error);
    return null;
  }
}

/**
 * Kiểm tra xem token có được mã hóa không
 * @param {string} token - Token cần kiểm tra
 * @returns {boolean} - True nếu token đã được mã hóa
 */
export function isTokenEncrypted(token) {
  if (!token) return false;
  
  try {
    // Kiểm tra xem có thể decode base64 không
    const decoded = Buffer.from(token, 'base64');
    // Kiểm tra xem có đủ độ dài để chứa IV (16 bytes) + encrypted data không
    return decoded.length > 16;
  } catch {
    return false;
  }
}

/**
 * Mask token để hiển thị (chỉ hiển thị 4 ký tự đầu và cuối)
 * @param {string} token - Token cần mask
 * @returns {string} - Token đã mask
 */
export function maskToken(token) {
  if (!token) return null;
  
  if (token.length <= 8) {
    return '***' + token.slice(-2);
  }
  
  return token.slice(0, 4) + '***' + token.slice(-4);
}
