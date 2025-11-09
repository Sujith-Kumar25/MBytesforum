// Socket.io instance will be set by server.js
let ioInstance = null;

module.exports = {
  setIO: (io) => {
    ioInstance = io;
  },
  getIO: () => {
    if (!ioInstance) {
      throw new Error('Socket.io not initialized. Call setIO first.');
    }
    return ioInstance;
  }
};


