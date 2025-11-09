const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  post: {
    type: String,
    required: true,
    unique: true,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Event Organizer', 'Sports Coordinator', 'Media Coordinator'],
    trim: true
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  winnerName: {
    type: String,
    required: true
  },
  totalVotesPerCandidate: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    name: String,
    votes: Number
  }],
  announcedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);


