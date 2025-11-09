const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mbytes-forum');
    console.log('Connected to MongoDB');

    const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@mbytes.com';
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin already exists. Updating password...');
      existing.password = password;
      await existing.save();
      console.log('Admin password updated:', email);
    } else {
      const admin = await Admin.create({ email, password });
      console.log('Admin created:', admin.email);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();


