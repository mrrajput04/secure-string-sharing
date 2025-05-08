// Required packages
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for our strings (in production, use a database)
const secretStrings = {};

// Generate a unique ID for each shared string
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// Encrypt string with password
function encryptString(text, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    encrypted,
    authTag
  };
}

// Decrypt string with password
function decryptString(encryptedData, password) {
  try {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return null; // Decryption failed (wrong password)
  }
}

// Routes
// API to create a new secured string
app.post('/api/strings', (req, res) => {
  const { string, password } = req.body;
  
  if (!string || !password) {
    return res.status(400).json({ error: 'String and password are required' });
  }
  
  const id = generateId();
  const encryptedData = encryptString(string, password);
  
  secretStrings[id] = encryptedData;
  
  res.json({ 
    success: true, 
    id,
    shareUrl: `${req.protocol}://${req.get('host')}/view/${id}`
  });
});

// API to retrieve a string with password
app.post('/api/strings/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  const encryptedData = secretStrings[id];
  
  if (!encryptedData) {
    return res.status(404).json({ error: 'String not found' });
  }
  
  const decrypted = decryptString(encryptedData, password);
  
  if (decrypted === null) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  
  res.json({ success: true, string: decrypted });
});

// HTML Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/view/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});