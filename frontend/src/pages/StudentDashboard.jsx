import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  getPosts,
  getCandidatesByPost,
  getForumCommittee,
  getCurrentPost,
  submitVote,
} from '../utils/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const {
    socket,
    votingStatus,
    currentPost,
    remainingTime,
    announcedResults,
    joinVoting,
  } = useSocket();
  const [posts, setPosts] = useState([]);
  const [forumCommittee, setForumCommittee] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState({});
  const [hasJoined, setHasJoined] = useState(false);
  const [votedPosts, setVotedPosts] = useState(new Set());
  const [hasVotedAll, setHasVotedAll] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (votingStatus === 'in_progress' && currentPost && hasJoined) {
      loadCandidatesForPost(currentPost);
    }
  }, [currentPost, votingStatus, hasJoined]);

  useEffect(() => {
    if (user?.hasVoted) {
      setHasVotedAll(true);
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleStudentCompleted = (data) => {
        if (data.registerNo === user?.registerNo) {
          setHasVotedAll(true);
        }
      };
      
      const handleResultAnnounced = async () => {
        // Reload forum committee when results are announced
        try {
          const committeeData = await getForumCommittee();
          setForumCommittee(committeeData.data);
        } catch (error) {
          console.error('Failed to reload forum committee:', error);
        }
      };
      
      socket.on('studentCompleted', handleStudentCompleted);
      socket.on('resultAnnounced', handleResultAnnounced);
      
      return () => {
        socket.off('studentCompleted', handleStudentCompleted);
        socket.off('resultAnnounced', handleResultAnnounced);
      };
    }
  }, [socket, user]);

  const loadData = async () => {
    try {
      const [postsData, committeeData] = await Promise.all([
        getPosts(),
        getForumCommittee(),
      ]);
      setPosts(postsData.data);
      setForumCommittee(committeeData.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const loadCandidatesForPost = async (postName) => {
    try {
      const response = await getCandidatesByPost(postName);
      setCandidates((prev) => ({
        ...prev,
        [postName]: response.data,
      }));
    } catch (error) {
      toast.error('Failed to load candidates');
    }
  };

  const handleJoin = () => {
    if (user?.registerNo) {
      joinVoting(user.registerNo);
      setHasJoined(true);
      toast.success('Joined voting!');
      if (currentPost) {
        loadCandidatesForPost(currentPost);
      }
    }
  };

  const handleVote = async (post, candidateId) => {
    if (!user?.registerNo) {
      toast.error('User not authenticated');
      return;
    }

    if (votedPosts.has(post)) {
      toast.error('You have already voted for this post');
      return;
    }

    try {
      setLoading(true);
      const response = await submitVote(user.registerNo, post, candidateId);
      
      // Update voted posts
      const newVotedPosts = new Set([...votedPosts, post]);
      setVotedPosts(newVotedPosts);
      setSelectedCandidate({});
      toast.success('Vote submitted successfully!');

      // Check if student has voted for all posts
      if (response.data.hasVotedAll) {
        setHasVotedAll(true);
      } else {
        // Check locally if all posts are voted
        const allVoted = posts.length > 0 && posts.every((p) => newVotedPosts.has(p.name));
        if (allVoted) {
          setHasVotedAll(true);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit vote');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPostCandidates = () => {
    if (!currentPost) return [];
    return candidates[currentPost] || [];
  };

  if (hasVotedAll) {
    // Check if any results have been announced
    // Forum committee should only be shown if results have been announced
    const hasAnnouncedResults = Object.keys(announcedResults).length > 0;
    const hasCommitteeMembers = forumCommittee && forumCommittee.length > 0;
    const shouldShowResults = hasAnnouncedResults || hasCommitteeMembers;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <h1 className="text-3xl font-bold text-center mb-4 text-green-800">
            Thank you for voting!
          </h1>
          <p className="text-center text-gray-700 mb-6">
            {shouldShowResults 
              ? 'Results have been announced below.' 
              : 'Results will be announced shortly, please wait.'}
          </p>
          {shouldShowResults && (
            <>
              {hasCommitteeMembers && <ForumCommitteeView committee={forumCommittee} />}
              {hasAnnouncedResults && <ResultsView results={announcedResults} />}
            </>
          )}
          <div className="mt-6 text-center">
            <button
              onClick={logout}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (votingStatus === 'not_started') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Voting will start soon, please stay connected.
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Welcome, {user?.name} ({user?.registerNo})
          </p>
          <div className="text-center">
            <button
              onClick={logout}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (votingStatus === 'ended') {
    // Check if any results have been announced
    // Forum committee should only be shown if results have been announced
    const hasAnnouncedResults = Object.keys(announcedResults).length > 0;
    const hasCommitteeMembers = forumCommittee && forumCommittee.length > 0;
    const shouldShowResults = hasAnnouncedResults || hasCommitteeMembers;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <h1 className="text-3xl font-bold text-center mb-4 text-purple-800">
            Voting has ended
          </h1>
          <p className="text-center text-gray-700 mb-6">
            {shouldShowResults 
              ? 'Results have been announced below.' 
              : 'Results will be announced shortly, please wait.'}
          </p>
          {shouldShowResults && (
            <>
              {hasCommitteeMembers && <ForumCommitteeView committee={forumCommittee} />}
              {hasAnnouncedResults && <ResultsView results={announcedResults} />}
            </>
          )}
          <div className="mt-6 text-center">
            <button
              onClick={logout}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (votingStatus === 'in_progress' && !hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Voting has started!
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Welcome, {user?.name} ({user?.registerNo})
          </p>
          <button
            onClick={handleJoin}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 text-lg font-semibold"
          >
            Join Voting
          </button>
          <div className="mt-4 text-center">
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPostCandidates = getCurrentPostCandidates();
  const hasVotedCurrentPost = votedPosts.has(currentPost);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                M-Bytes Forum Election
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.name} ({user?.registerNo})
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPost && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentPost}
              </h2>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {remainingTime}s
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>

            {hasVotedCurrentPost ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 font-semibold">
                  ✓ You have voted for this post
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentPostCandidates.length === 0 ? (
                  <p className="text-gray-600">Loading candidates...</p>
                ) : (
                  currentPostCandidates.map((candidate) => (
                    <div
                      key={candidate._id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCandidate[currentPost] === candidate._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() =>
                        setSelectedCandidate({
                          ...selectedCandidate,
                          [currentPost]: candidate._id,
                        })
                      }
                    >
                      <div className="flex items-start space-x-4">
                        {candidate.photoUrl && (
                          <img
                            src={candidate.photoUrl}
                            alt={candidate.name}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {candidate.department} - {candidate.year}
                          </p>
                          <p className="text-gray-700 mt-2">
                            {candidate.manifesto}
                          </p>
                        </div>
                        {selectedCandidate[currentPost] === candidate._id && (
                          <div className="text-blue-600 text-2xl">✓</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {selectedCandidate[currentPost] && (
                  <button
                    onClick={() =>
                      handleVote(currentPost, selectedCandidate[currentPost])
                    }
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                  >
                    {loading ? 'Submitting...' : 'Submit Vote'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Only show Forum Committee and Results if results have been announced */}
        {(() => {
          const hasAnnouncedResults = Object.keys(announcedResults).length > 0;
          const hasCommitteeMembers = forumCommittee && forumCommittee.length > 0;
          const shouldShowResults = hasAnnouncedResults || hasCommitteeMembers;
          
          if (!shouldShowResults) {
            return null;
          }
          
          // Build array of components to show
          const componentsToShow = [];
          if (hasCommitteeMembers) {
            componentsToShow.push(<ForumCommitteeView key="committee" committee={forumCommittee} />);
          }
          if (hasAnnouncedResults) {
            componentsToShow.push(<ResultsView key="results" results={announcedResults} />);
          }
          
          // Show in grid if we have multiple components, otherwise show single component
          if (componentsToShow.length === 0) {
            return null;
          } else if (componentsToShow.length === 1) {
            return <div className="max-w-2xl mx-auto">{componentsToShow[0]}</div>;
          } else {
            return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{componentsToShow}</div>;
          }
        })()}
      </div>
    </div>
  );
};

const ForumCommitteeView = ({ committee }) => {
  // Only render if there are committee members (results announced)
  if (!committee || committee.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Forum Committee</h2>
      <div className="space-y-3">
        {committee.map((member) => (
          <div
            key={member._id}
            className="bg-blue-50 p-4 rounded-lg border border-blue-200"
          >
            <h3 className="font-bold text-blue-800">{member.post}</h3>
            <p className="text-gray-700">{member.name}</p>
            <p className="text-sm text-gray-600">
              {member.dept} - {member.year}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultsView = ({ results }) => {
  const announcedPosts = Object.keys(results);

  if (announcedPosts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Announced Results</h2>
      <div className="space-y-4">
        {announcedPosts.map((post) => {
          const result = results[post];
          return (
            <div
              key={post}
              className="bg-green-50 p-4 rounded-lg border border-green-200"
            >
              <h3 className="font-bold text-green-800 text-lg">{post}</h3>
              <p className="text-green-700 font-semibold mt-2">
                Winner: {result.winnerName}
              </p>
              <p className="text-sm text-green-600">
                {result.winnerDepartment} - {result.winnerYear}
              </p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Vote Counts:
                </p>
                {result.totalVotesPerCandidate.map((c) => (
                  <div
                    key={c.candidateId}
                    className={`text-sm ${
                      c.candidateId === result.winnerId
                        ? 'font-bold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {c.name}: {c.votes} votes
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentDashboard;

