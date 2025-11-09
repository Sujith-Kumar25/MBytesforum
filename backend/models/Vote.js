const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentRegisterNo: {
    type: String,
    required: true
  },
  post: {
    type: String,
    required: true,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Event Organizer', 'Sports Coordinator', 'Media Coordinator'],
    trim: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate votes
voteSchema.index({ studentId: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);


