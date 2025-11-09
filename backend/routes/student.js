const express = require('express');
const { authenticateStudent } = require('../middleware/auth');
const Post = require('../models/Post');
const AdminControl = require('../models/AdminControl');
const router = express.Router();

// Get current post info
router.get('/posts/current', authenticateStudent, async (req, res) => {
  try {
    const control = await AdminControl.getControl();
    
    res.json({
      status: control.status,
      currentPost: control.currentPost,
      postStartAt: control.postStartAt
    });
  } catch (error) {
    console.error('Get current post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


