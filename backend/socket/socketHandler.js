const AdminControl = require('../models/AdminControl');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current voting status on connection
    AdminControl.getControl().then(control => {
      socket.emit('votingStatus', { status: control.status });
      if (control.status === 'in_progress') {
        socket.emit('votingStarted');
        if (control.currentPost && control.postStartAt) {
          // Calculate remaining time
          const elapsed = Math.floor((Date.now() - control.postStartAt.getTime()) / 1000);
          const remainingTime = Math.max(0, 20 - elapsed);
          
          if (remainingTime > 0) {
            socket.emit('showPost', {
              post: control.currentPost,
              remainingTime
            });
          }
        }
      } else if (control.status === 'ended') {
        socket.emit('votingEnded');
      }
    }).catch(err => {
      console.error('Error sending voting status:', err);
    });

    // Handle student joining voting
    socket.on('joinVoting', async (data) => {
      try {
        const { registerNo } = data;
        // Join a room for this student (optional, for targeted messaging)
        socket.join(`student-${registerNo}`);
        console.log(`Student ${registerNo} joined voting`);
      } catch (error) {
        console.error('Join voting error:', error);
      }
    });

    // Handle vote submission via socket (optional, API is primary)
    socket.on('vote', async (data) => {
      try {
        // Vote handling is done via REST API for better reliability
        // This is just for acknowledgment if needed
        socket.emit('voteReceived', { message: 'Vote processing...' });
      } catch (error) {
        console.error('Socket vote error:', error);
        socket.emit('voteError', { message: 'Error processing vote' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

