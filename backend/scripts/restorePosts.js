const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('../models/Post');

const restorePosts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mbytes-forum');
    console.log('Connected to MongoDB');

    // Define all posts
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

    console.log('Restoring posts...');
    
    // Delete all existing posts first (optional - comment out if you want to keep existing ones)
    // await Post.deleteMany({});
    // console.log('Deleted all existing posts');

    // Create/update posts
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const post of posts) {
      const existingPost = await Post.findOne({ name: post.name });
      
      if (existingPost) {
        // Update existing post
        existingPost.order = post.order;
        await existingPost.save();
        updatedCount++;
        console.log(`✓ Updated post: ${post.name}`);
      } else {
        // Create new post
        await Post.create({
          name: post.name,
          order: post.order
        });
        createdCount++;
        console.log(`✓ Created post: ${post.name}`);
      }
    }

    console.log('\n========================================');
    console.log('Posts restoration complete!');
    console.log(`Created: ${createdCount} posts`);
    console.log(`Updated: ${updatedCount} posts`);
    console.log('========================================\n');

    // Verify all posts exist
    const allPosts = await Post.find().sort({ order: 1 });
    console.log('Current posts in database:');
    allPosts.forEach(post => {
      console.log(`  ${post.order}. ${post.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error restoring posts:', error);
    process.exit(1);
  }
};

restorePosts();


