const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  if (!secretKey) {
    return res.status(500).json({ message: 'JWT secret key is not configured in the environment' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secretKey);

    if (!decoded.id && !decoded._id) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token structure' });
    }

    req.user = {
      id: decoded.id || decoded._id,
      ...decoded, 
    };

    next();
  } catch (err) {
    console.error('JWT Error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please log in again' });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token signature' });
    }

    return res.status(401).json({ message: `Invalid token: ${err.message}` });
  }
};

module.exports = authenticate;
