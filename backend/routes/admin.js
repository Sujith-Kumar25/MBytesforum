const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { authenticateAdmin } = require('../middleware/auth');
const Student = require('../models/Student');
const Candidate = require('../models/Candidate');
const Post = require('../models/Post');
const AdminControl = require('../models/AdminControl');
const Result = require('../models/Result');
const ForumCommittee = require('../models/ForumCommittee');
const Vote = require('../models/Vote');
const socketIO = require('../socket/io');

const router = express.Router();

// Multer configuration for CSV upload
const upload = multer({ dest: 'uploads/' });

// Initialize posts if they don't exist
const initializePosts = async () => {
  const posts = [
    { name: 'President', order: 1 },
    { name: 'Vice President', order: 2 },
    { name: 'Secretary', order: 3 },
    { name: 'Joint Secretary', order: 4 },
    { name: 'Treasurer', order: 5 },
    { name: 'Event Organizer', order: 6 },
    { name: 'Sports Coordinator', order: 7 },
    { name: 'Media Coordinator', order: 8 }
  ];

  for (const post of posts) {
    await Post.findOneAndUpdate(
      { name: post.name },
      { name: post.name, order: post.order },
      { upsert: true }
    );
  }
};

// Import students from CSV
router.post('/students/import', authenticateAdmin, upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            const { registerNo, name, Password, year, department } = row;

            if (!registerNo || !name || !Password || !year || !department) {
              errors.push(`Row ${i + 2}: Missing required fields`);
              continue;
            }

            // Check if student already exists
            const existing = await Student.findOne({ registerNo });
            if (existing) {
              errors.push(`Row ${i + 2}: Student with registerNo ${registerNo} already exists`);
              continue;
            }

            // Create student (password will be hashed by pre-save hook)
            await Student.create({
              registerNo: registerNo.trim(),
              name: name.trim(),
              password: Password.trim(),
              year: year.trim(),
              department: department.trim()
            });
          } catch (error) {
            errors.push(`Row ${i + 2}: ${error.message}`);
          }
        }

        res.json({
          message: `Imported ${results.length - errors.length} students successfully`,
          errors: errors.length > 0 ? errors : undefined
        });
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error reading CSV file', error: error.message });
      });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add single student
router.post('/students', authenticateAdmin, async (req, res) => {
  try {
    const { registerNo, name, password, year, department } = req.body;

    if (!registerNo || !name || !password || !year || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Student.findOne({ registerNo });
    if (existing) {
      return res.status(400).json({ message: 'Student with this register number already exists' });
    }

    const student = await Student.create({
      registerNo,
      name,
      password,
      year,
      department
    });

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student._id,
        registerNo: student.registerNo,
        name: student.name,
        department: student.department,
        year: student.year
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students
router.get('/students', authenticateAdmin, async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add candidate
router.post('/candidates', authenticateAdmin, async (req, res) => {
  try {
    const { name, post, department, year, manifesto, photoUrl } = req.body;

    if (!name || !post || !department || !year || !manifesto) {
      return res.status(400).json({ message: 'All fields except photoUrl are required' });
    }

    // Initialize posts if needed
    await initializePosts();

    const candidate = await Candidate.create({
      name,
      post,
      department,
      year,
      manifesto,
      photoUrl: photoUrl || ''
    });

    res.status(201).json({
      message: 'Candidate created successfully',
      candidate
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all candidates (admin can see votes)
router.get('/candidates', authenticateAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ post: 1, name: 1 });
    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update candidate
router.put('/candidates/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, post, department, year, manifesto, photoUrl } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Update fields if provided
    if (name) candidate.name = name;
    if (post) candidate.post = post;
    if (department) candidate.department = department;
    if (year) candidate.year = year;
    if (manifesto) candidate.manifesto = manifesto;
    if (typeof photoUrl !== 'undefined') candidate.photoUrl = photoUrl || '';

    // Ensure posts exist if post changed
    if (post) {
      await initializePosts();
    }

    // Recalculate votes for this candidate from Vote collection
    const votesCount = await Vote.countDocuments({ candidateId: candidate._id });
    candidate.votes = votesCount;

    await candidate.save();

    res.json({ message: 'Candidate updated successfully', candidate });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete candidate (and related votes)
router.delete('/candidates/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Remove associated votes
    await Vote.deleteMany({ candidateId: candidate._id });

    // Delete candidate
    await Candidate.findByIdAndDelete(candidate._id);

    res.json({ message: 'Candidate and related votes deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Restore posts (useful if posts are deleted)
router.post('/posts/restore', authenticateAdmin, async (req, res) => {
  try {
    await initializePosts();
    const posts = await Post.find().sort({ order: 1 });
    res.json({
      message: 'Posts restored successfully',
      posts: posts.map(p => ({ name: p.name, order: p.order }))
    });
  } catch (error) {
    console.error('Restore posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts (admin)
router.get('/posts', authenticateAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ order: 1 });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start voting
router.post('/control/start', authenticateAdmin, async (req, res) => {
  try {
    await initializePosts();
    const control = await AdminControl.getControl();

    if (control.status === 'in_progress') {
      return res.status(400).json({ message: 'Voting is already in progress' });
    }

    // Get posts in order
    const posts = await Post.find().sort({ order: 1 });
    if (posts.length === 0) {
      return res.status(400).json({ message: 'No posts configured' });
    }

    // Reset to first post
    control.status = 'in_progress';
    control.currentPost = posts[0].name;
    control.currentPostIndex = 0;
    control.postStartAt = new Date();
    await control.save();

    // Emit voting started event
    const io = socketIO.getIO();
    io.emit('votingStatus', { status: 'in_progress' });
    io.emit('votingStarted');

    // Start the post timer (60 seconds)
    await startPostTimer(control, posts);

    res.json({
      message: 'Voting started',
      currentPost: control.currentPost,
      status: control.status
    });
  } catch (error) {
    console.error('Start voting error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Next post (manual override)
router.post('/control/next', authenticateAdmin, async (req, res) => {
  try {
    const control = await AdminControl.getControl();

    if (control.status !== 'in_progress') {
      return res.status(400).json({ message: 'Voting is not in progress' });
    }

    const posts = await Post.find().sort({ order: 1 });
    await advanceToNextPost(control, posts);

    res.json({
      message: 'Moved to next post',
      currentPost: control.currentPost
    });
  } catch (error) {
    console.error('Next post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End voting
router.post('/control/end', authenticateAdmin, async (req, res) => {
  try {
    const control = await AdminControl.getControl();
    control.status = 'ended';
    control.currentPost = null;
    control.postStartAt = null;
    await control.save();

    // Clear any running timers (stored in module scope)
    if (global.postTimer) {
      clearInterval(global.postTimer);
      global.postTimer = null;
    }

    const io = socketIO.getIO();
    io.emit('votingStatus', { status: 'ended' });
    io.emit('votingEnded');

    res.json({ message: 'Voting ended', status: control.status });
  } catch (error) {
    console.error('End voting error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get post totals (aggregated, not per candidate)
router.get('/post-totals', authenticateAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ order: 1 });
    const totals = [];

    for (const post of posts) {
      const voteCount = await Vote.countDocuments({ post: post.name });
      totals.push({
        post: post.name,
        totalVotes: voteCount
      });
    }

    res.json(totals);
  } catch (error) {
    console.error('Get post totals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Announce result for a post
router.post('/announce/:post', authenticateAdmin, async (req, res) => {
  try {
    const { post } = req.params;

    // Get all candidates for this post with their vote counts
    const candidates = await Candidate.find({ post }).sort({ votes: -1, _id: 1 });

    if (candidates.length === 0) {
      return res.status(404).json({ message: 'No candidates found for this post' });
    }

    // Find winner (highest votes, if tie then earliest _id)
    const winner = candidates[0];
    const maxVotes = winner.votes;

    // Build totalVotesPerCandidate array
    const totalVotesPerCandidate = candidates.map(c => ({
      candidateId: c._id,
      name: c.name,
      votes: c.votes
    }));

    // Save or update result
    const result = await Result.findOneAndUpdate(
      { post },
      {
        post,
        winnerId: winner._id,
        winnerName: winner.name,
        totalVotesPerCandidate,
        announcedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Add to forum committee
    await ForumCommittee.findOneAndUpdate(
      { post },
      {
        post,
        candidateId: winner._id,
        name: winner.name,
        dept: winner.department,
        year: winner.year,
        announcedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Emit result announced event
    const io = socketIO.getIO();
    io.emit('resultAnnounced', {
      post,
      winnerId: winner._id.toString(),
      winnerName: winner.name,
      winnerDepartment: winner.department,
      winnerYear: winner.year,
      totalVotesPerCandidate,
      announcedAt: result.announcedAt
    });

    res.json({
      message: 'Result announced',
      result: {
        post,
        winner: {
          id: winner._id,
          name: winner.name,
          department: winner.department,
          year: winner.year
        },
        totalVotesPerCandidate
      }
    });
  } catch (error) {
    console.error('Announce result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to start post timer
async function startPostTimer(control, posts) {
  // Clear any existing timer
  if (global.postTimer) {
    clearInterval(global.postTimer);
    global.postTimer = null;
  }

  // Reload control to get latest state
  const currentControl = await AdminControl.getControl();
  if (currentControl.status !== 'in_progress') {
    return;
  }

  let remainingTime = 60; // 60 seconds
  const startTime = Date.now();

  // Emit initial post
  const io = socketIO.getIO();
  io.emit('showPost', {
    post: currentControl.currentPost,
    remainingTime
  });

  // Timer countdown
  global.postTimer = setInterval(async () => {
    // Recalculate remaining time based on actual elapsed time
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remainingTime = Math.max(0, 60 - elapsed);

    // Reload control to check status
    const updatedControl = await AdminControl.getControl();
    if (updatedControl.status !== 'in_progress' || updatedControl.currentPost !== currentControl.currentPost) {
      clearInterval(global.postTimer);
      global.postTimer = null;
      return;
    }

    if (remainingTime > 0) {
      // Emit countdown update
      const io = socketIO.getIO();
      io.emit('showPost', {
        post: updatedControl.currentPost,
        remainingTime
      });
    } else {
      // Time's up, move to next post
      clearInterval(global.postTimer);
      global.postTimer = null;

      await advanceToNextPost(updatedControl, posts);
    }
  }, 1000);
}

// Helper function to advance to next post
async function advanceToNextPost(control, posts) {
  const nextIndex = control.currentPostIndex + 1;

  if (nextIndex >= posts.length) {
    // All posts completed
    control.status = 'ended';
    control.currentPost = null;
    control.postStartAt = null;
    await control.save();

    const io = socketIO.getIO();
    io.emit('votingStatus', { status: 'ended' });
    io.emit('votingEnded');
  } else {
    // Move to next post
    control.currentPost = posts[nextIndex].name;
    control.currentPostIndex = nextIndex;
    control.postStartAt = new Date();
    await control.save();

    // Start timer for next post
    await startPostTimer(control, posts);
  }
}

module.exports = router;

