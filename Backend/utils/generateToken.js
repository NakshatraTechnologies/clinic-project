const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for a user
 * @param {string} id - User's MongoDB _id
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
