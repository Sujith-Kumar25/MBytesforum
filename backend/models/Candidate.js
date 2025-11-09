const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  post: {
    type: String,
    required: true,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Event Organizer', 'Sports Coordinator', 'Media Coordinator'],
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  manifesto: {
    type: String,
    required: true,
    trim: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  votes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
candidateSchema.index({ post: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);


