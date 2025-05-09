const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const securityMiddleware = [
  helmet(),
  body('string').trim().notEmpty().escape(),
  body('password').isLength({ min: 8 }).matches(/\d/).matches(/[A-Z]/),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = securityMiddleware;