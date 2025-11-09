const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const router = express.Router();

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { registerNo, password } = req.body;

    if (!registerNo || !password) {
      return res.status(400).json({ message: 'Register number and password are required' });
    }

    const student = await Student.findOne({ registerNo });
    if (!student) {
      return res.status(401).json({ message: 'You are not authorized to vote.' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (student.hasVoted) {
      return res.status(403).json({ message: 'You have already cast your vote.' });
    }

    const token = jwt.sign(
      { id: student._id, role: 'student', registerNo: student.registerNo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      student: {
        id: student._id,
        registerNo: student.registerNo,
        name: student.name,
        department: student.department,
        year: student.year,
        hasVoted: student.hasVoted
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


