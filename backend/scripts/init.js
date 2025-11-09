const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../models/Admin');
const Post = require('../models/Post');

const initialize = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mbytes-forum');
    console.log('Connected to MongoDB');

    // Create admin user if it doesn't exist
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@mbytes.com' });
    if (!adminExists) {
      const admin = await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@mbytes.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists');
    }

    // Initialize posts
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
    console.log('Posts initialized');

    console.log('Initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
};

initialize();


