const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16); // Initialization vector

function deriveKey(password) {
  // Derive a 32-byte key from the password
  return crypto.pbkdf2Sync(password, 'some_salt', 100000, 32, 'sha256');
}

function encrypt(text) {
  const key = deriveKey(process.env.JWT_SECRET_KEY); // Use the derived key
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Store IV with encrypted text
}

function decrypt(text) {
  const key = deriveKey(process.env.JWT_SECRET_KEY);
  const [ivHex, encryptedText] = text.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
