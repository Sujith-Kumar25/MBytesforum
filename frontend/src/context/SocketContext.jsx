import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [votingStatus, setVotingStatus] = useState('not_started');
  const [currentPost, setCurrentPost] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [announcedResults, setAnnouncedResults] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('votingStatus', (data) => {
      setVotingStatus(data.status);
    });

    newSocket.on('votingStarted', () => {
      setVotingStatus('in_progress');
    });

    newSocket.on('votingEnded', () => {
      setVotingStatus('ended');
      setCurrentPost(null);
      setRemainingTime(0);
    });

    newSocket.on('showPost', (data) => {
      setCurrentPost(data.post);
      setRemainingTime(data.remainingTime);
    });

    newSocket.on('resultAnnounced', (data) => {
      setAnnouncedResults((prev) => ({
        ...prev,
        [data.post]: data,
      }));
    });

    newSocket.on('studentCompleted', (data) => {
      console.log('Student completed:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinVoting = (registerNo) => {
    if (socket && registerNo) {
      socket.emit('joinVoting', { registerNo });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        votingStatus,
        currentPost,
        remainingTime,
        announcedResults,
        joinVoting,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};


