// Required packages
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const path = require('path');
const QRCode = require('qrcode');
const helmet = require('helmet');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for our strings (in production, use a database)
const secretStrings = {};

// Rate limiting configuration
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // Maximum failed attempts per IP within the window
  blockedIPs: {}, // Store for blocked IPs
  attempts: {} // Store for tracking attempts
};

// Generate a unique ID for each shared string
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// Use Helmet to secure HTTP headers

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "stackpath.bootstrapcdn.com"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"]
    }
  }
}));

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
    console.error('Decryption error:', error);
    return null; // Decryption failed (wrong password)
  }
}

// Clean up expired strings
function cleanupExpiredStrings() {
  const now = Date.now();
  for (const id in secretStrings) {
    if (secretStrings[id].expiresAt && secretStrings[id].expiresAt < now) {
      delete secretStrings[id];
      console.log(`String ${id} expired and was deleted`);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredStrings, 60 * 60 * 1000);

// Rate limiting middleware
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;


  // Check if IP is blocked
  if (rateLimiter.blockedIPs[ip] && rateLimiter.blockedIPs[ip] > Date.now()) {
    const remainingTime = Math.ceil((rateLimiter.blockedIPs[ip] - Date.now()) / 1000 / 60);
    return res.status(429).json({
      error: `Too many failed attempts. Please try again in ${remainingTime} minutes.`
    })
  }


  // Reset blocked status if time has passed
  if (rateLimiter.blockedIPs[ip] && rateLimiter.blockedIPs[ip] <= Date.now()) {
    delete rateLimiter.blockedIPs[ip];
    delete rateLimiter.attempts[ip];
  }


  next();
}

// Routes
// API to create a new secured string
app.post('/api/strings', async (req, res) => {
  const { string, password, expiration, format } = req.body;

  if (!string || !password) {
    return res.status(400).json({ error: 'String and password are required' });
  }

  const id = generateId();

  // Handle markdown formatting if specified
  let processedString = string;
  if (format === 'markdown') {
    const showdown = require('showdown');
    const converter = new showdown.Converter();
    processedString = converter.makeHtml(string);
  }

  const encryptedData = encryptString(processedString, password);

  let expiresAt = null;
  if (expiration && !isNaN(expiration)) {
    expiresAt = Date.now() + (parseInt(expiration) * 60 * 60 * 1000);
  }

  secretStrings[id] = {
    ...encryptedData,
    format: format || 'text',
    expiresAt,
    createdAt: Date.now()
  };

  const shareUrl = `${req.protocol}://${req.get('host')}/view/${id}`;

  try {
    const qrCode = await generateCustomQR(shareUrl);

    // Generate social share links
    const socialLinks = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };

    res.json({
      success: true,
      id,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      shareUrl,
      qrCode,
      socialLinks
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.json({
      success: true,
      id,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      shareUrl
    });
  }
});


// API to retrieve a string with password
app.post('/api/strings/:id', rateLimit, (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const encryptedData = secretStrings[id];
  
  if (!encryptedData) {
    return res.status(404).json({ error: 'String not found or expired' });
  }

  const decrypted = decryptString(encryptedData, password);
  
  if (!decrypted) {
    // Handle rate limiting for failed attempts
    if (!rateLimiter.attempts[ip]) {
      rateLimiter.attempts[ip] = { count: 1, firstAttempt: Date.now() };
    } else {
      rateLimiter.attempts[ip].count++;
    }

    if (rateLimiter.attempts[ip].count >= rateLimiter.maxAttempts) {
      rateLimiter.blockedIPs[ip] = Date.now() + (15 * 60 * 1000); // Block for 15 minutes
      delete rateLimiter.attempts[ip];
      return res.status(429).json({ error: 'Too many failed attempts. Please try again in 15 minutes.' });
    }

    return res.status(401).json({ error: 'Incorrect password' });
  }

  // Reset attempts on successful decryption
  delete rateLimiter.attempts[ip];

  res.json({
    success: true,
    string: decrypted,
    contentType: encryptedData.contentType || 'text' // Include content type
  });
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

// Add multer for file handling
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Add media upload endpoint
app.post('/api/upload-media', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl
  });
});

// API to upload and encrypt file
app.post('/api/files', upload.single('file'), async (req, res) => {
  try {
    const { password, expiration } = req.body;
    if (!req.file || !password) {
      return res.status(400).json({ error: 'File and password are required' });
    }

    // Read file content properly
    const fileContent = await fs.promises.readFile(req.file.path);
    const id = generateId();
    const encryptedData = encryptString(fileContent.toString('base64'), password);

    let expiresAt = null;
    if (expiration && !isNaN(expiration)) {
      expiresAt = Date.now() + (parseInt(expiration) * 60 * 60 * 1000);
    }

    secretStrings[id] = {
      ...encryptedData,
      isFile: true,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      expiresAt,
      createdAt: Date.now()
    };

    const shareUrl = `${req.protocol}://${req.get('host')}/view/${id}`;
    res.json({
      success: true,
      id,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      shareUrl
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// Enhanced QR Code generation with customization
function generateCustomQR(url, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  };

  const qrOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    QRCode.toDataURL(url, qrOptions, (err, qrDataUrl) => {
      if (err) reject(err);
      else resolve(qrDataUrl);
    });
  });
}