const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '1d',
  });