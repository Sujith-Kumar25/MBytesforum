const mongoose = require('mongoose');

const adminControlSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'ended'],
    default: 'not_started'
  },
  currentPost: {
    type: String,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Event Organizer', 'Sports Coordinator', 'Media Coordinator', null],
    default: null
  },
  postStartAt: {
    type: Date,
    default: null
  },
  currentPostIndex: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure only one document exists
adminControlSchema.statics.getControl = async function() {
  let control = await this.findOne();
  if (!control) {
    control = await this.create({});
  }
  return control;
};

module.exports = mongoose.model('AdminControl', adminControlSchema);


