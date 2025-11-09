const mongoose = require('mongoose');

const forumCommitteeSchema = new mongoose.Schema({
  post: {
    type: String,
    required: true,
    unique: true,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Event Organizer', 'Sports Coordinator', 'Media Coordinator'],
    trim: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dept: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  announcedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ForumCommittee', forumCommitteeSchema);


