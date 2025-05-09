const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
  
    if (req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Admin access required' });
    }
  };
  
  module.exports = isAdmin;
  