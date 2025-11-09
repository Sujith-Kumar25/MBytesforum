const express = require('express');
const Post = require('../models/Post');
const Candidate = require('../models/Candidate');
const ForumCommittee = require('../models/ForumCommittee');
const router = express.Router();

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ order: 1 });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get candidates for a post (without vote counts for non-admin)
router.get('/candidates/:post', async (req, res) => {
  try {
    const { post } = req.params;
    const candidates = await Candidate.find({ post }).select('-votes');
    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get forum committee
router.get('/forum-committee', async (req, res) => {
  try {
    const committee = await ForumCommittee.find()
      .populate('candidateId', 'name department year photoUrl')
      .sort({ createdAt: 1 });
    res.json(committee);
  } catch (error) {
    console.error('Get forum committee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


