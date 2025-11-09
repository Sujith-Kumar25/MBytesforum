const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Event Organizer', 'Sports Coordinator', 'Media Coordinator'],
    trim: true
  },
  order: {
    type: Number,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);


