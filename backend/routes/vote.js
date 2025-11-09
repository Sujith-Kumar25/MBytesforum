const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Post = require('../models/Post');
const AdminControl = require('../models/AdminControl');
const socketIO = require('../socket/io');
const router = express.Router();

// Submit vote
router.post('/vote', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentRegisterNo, post, candidateId } = req.body;

    if (!studentRegisterNo || !post || !candidateId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check voting status
    const control = await AdminControl.getControl();
    if (control.status !== 'in_progress') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Voting is not in progress' });
    }

    if (control.currentPost !== post) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Voting for ${post} is not currently open` });
    }

    // Find student
    const student = await Student.findOne({ registerNo: studentRegisterNo }).session(session);
    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.hasVoted) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'You have already cast your vote' });
    }

    // Check if student already voted for this post
    if (student.votedPosts.has(post)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You have already voted for this post' });
    }

    // Verify candidate exists and is for this post
    const candidate = await Candidate.findById(candidateId).session(session);
    if (!candidate) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (candidate.post !== post) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Candidate does not belong to this post' });
    }

    // Create vote record
    await Vote.create([{
      studentId: student._id,
      studentRegisterNo: student.registerNo,
      post,
      candidateId
    }], { session });

    // Atomically increment candidate votes
    await Candidate.findByIdAndUpdate(
      candidateId,
      { $inc: { votes: 1 } },
      { session }
    );

    // Update student votedPosts
    student.votedPosts.set(post, candidateId);
    
    // Check if student has voted for all posts before saving
    const posts = await Post.find().session(session);
    const allPostsVoted = posts.length > 0 && posts.every(p => {
      // Current post is being voted now, so include it in the check
      if (p.name === post) return true;
      return student.votedPosts.has(p.name);
    });

    if (allPostsVoted) {
      student.hasVoted = true;
    }
    
    await student.save({ session });
    
    if (allPostsVoted) {
      // Emit student completed event
      const io = socketIO.getIO();
      io.emit('studentCompleted', {
        registerNo: student.registerNo,
        name: student.name
      });
    }

    await session.commitTransaction();

    res.json({
      message: 'Vote submitted successfully',
      hasVotedAll: allPostsVoted
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Vote submission error:', error);

    // Handle duplicate vote error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted for this post' });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;

