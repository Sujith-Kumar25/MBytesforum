const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Admin authentication middleware
exports.authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided. Please login again.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please login again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin permission required. Please login as admin.' });
    }

    req.adminId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    return res.status(401).json({ message: 'Authentication failed. Please login again.' });
  }
};

// Student authentication middleware
exports.authenticateStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided. Please login again.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please login again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'student') {
      return res.status(403).json({ message: 'Student access required. Please login as student.' });
    }

    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    req.student = student;
    req.studentId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    return res.status(401).json({ message: 'Authentication failed. Please login again.' });
  }
};

