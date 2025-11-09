import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  getCandidates,
  getPosts,
  getPostTotals,
  startVoting,
  nextPost,
  endVoting,
  announceResult,
  getForumCommittee,
  importStudents,
  addStudent,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  restorePosts,
} from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { votingStatus, currentPost, announcedResults } = useSocket();
  const [posts, setPosts] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [postTotals, setPostTotals] = useState([]);
  const [forumCommittee, setForumCommittee] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [newStudent, setNewStudent] = useState({
    registerNo: '',
    name: '',
    password: '',
    year: '',
    department: '',
  });
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    post: '',
    department: '',
    year: '',
    manifesto: '',
    photoUrl: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (votingStatus === 'in_progress') {
        loadPostTotals();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [votingStatus]);

  const loadData = async () => {
    try {
      const [postsData, candidatesData, committeeData] = await Promise.all([
        getPosts(),
        getCandidates(),
        getForumCommittee(),
      ]);
      setPosts(postsData.data);
      setCandidates(candidatesData.data);
      setForumCommittee(committeeData.data);
      if (votingStatus === 'in_progress') {
        loadPostTotals();
      }
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const loadPostTotals = async () => {
    try {
      const response = await getPostTotals();
      setPostTotals(response.data);
    } catch (error) {
      console.error('Failed to load post totals:', error);
    }
  };

  const handleStartVoting = async () => {
    try {
      setLoading(true);
      await startVoting();
      toast.success('Voting started!');
      loadPostTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start voting');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPost = async () => {
    try {
      await nextPost();
      toast.success('Moved to next post');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to move to next post');
    }
  };

  const handleEndVoting = async () => {
    try {
      await endVoting();
      toast.success('Voting ended');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end voting');
    }
  };

  const handleAnnounceResult = async (post) => {
    try {
      const response = await announceResult(post);
      toast.success(`Result announced for ${post}`);
      loadData();
      loadPostTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to announce result');
    }
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    try {
      setLoading(true);
      const response = await importStudents(csvFile);
      toast.success(response.data.message);
      setCsvFile(null);
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('Import errors:', response.data.errors);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addStudent(newStudent);
      toast.success('Student added successfully');
      setNewStudent({
        registerNo: '',
        name: '',
        password: '',
        year: '',
        department: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        toast.error('You are not authenticated. Please login again.');
        logout();
        return;
      }
      
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        toast.error('Admin permission required. Please login as admin.');
        logout();
        return;
      }
      
      if (editingId) {
        // update existing candidate
        await updateCandidate(editingId, newCandidate);
        toast.success('Candidate updated successfully');
        setEditingId(null);
      } else {
        await addCandidate(newCandidate);
        toast.success('Candidate added successfully');
      }

      setNewCandidate({
        name: '',
        post: '',
        department: '',
        year: '',
        manifesto: '',
        photoUrl: '',
      });
      loadData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add candidate';
      toast.error(errorMessage);
      console.error('Add candidate error:', error);
      
      // If it's an auth error, the interceptor will handle redirect
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Don't do anything here, the interceptor will redirect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingId(candidate._id);
    setNewCandidate({
      name: candidate.name || '',
      post: candidate.post || '',
      department: candidate.department || '',
      year: candidate.year || '',
      manifesto: candidate.manifesto || '',
      photoUrl: candidate.photoUrl || '',
    });
    // Switch to candidates tab if not already
    setActiveTab('candidates');
    // Scroll to form (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCandidate = async (id) => {
    if (!confirm('Are you sure you want to delete this candidate? This will also remove related votes.')) return;
    try {
      setLoading(true);
      await deleteCandidate(id);
      toast.success('Candidate deleted');
      // If deleting the candidate being edited, clear the form
      if (editingId === id) {
        setEditingId(null);
        setNewCandidate({
          name: '',
          post: '',
          department: '',
          year: '',
          manifesto: '',
          photoUrl: '',
        });
      }
      loadData();
    } catch (error) {
      console.error('Delete candidate error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete candidate');
    } finally {
      setLoading(false);
    }
  };

  const getPostTotal = (postName) => {
    const total = postTotals.find((p) => p.post === postName);
    return total ? total.totalVotes : 0;
  };

  const getCandidatesForPost = (postName) => {
    return candidates.filter((c) => c.post === postName);
  };

  const getResultForPost = (postName) => {
    return announcedResults[postName];
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-4 mb-4 flex-wrap">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Import Students
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'candidates'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Add Candidate
            </button>
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const response = await restorePosts();
                  toast.success(response.data.message || 'Posts restored successfully!');
                  loadData();
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Failed to restore posts');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Restoring...' : 'Restore Posts'}
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Voting Controls</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleStartVoting}
                    disabled={loading || votingStatus === 'in_progress'}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Voting
                  </button>
                  <button
                    onClick={handleNextPost}
                    disabled={loading || votingStatus !== 'in_progress'}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Post
                  </button>
                  <button
                    onClick={handleEndVoting}
                    disabled={loading || votingStatus !== 'in_progress'}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    End Voting
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-gray-700">
                    Status: <span className="font-bold">{votingStatus}</span>
                  </p>
                  {currentPost && (
                    <p className="text-gray-700">
                      Current Post: <span className="font-bold">{currentPost}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Forum Committee</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {forumCommittee.map((member) => (
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

              <div>
                <h2 className="text-2xl font-bold mb-4">Posts & Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {posts.map((post) => {
                    const postCandidates = getCandidatesForPost(post.name);
                    const total = getPostTotal(post.name);
                    const result = getResultForPost(post.name);
                    const isAnnounced = !!result;

                    return (
                      <div
                        key={post._id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <h3 className="font-bold text-lg mb-2">{post.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Candidates: {postCandidates.length}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          Total Votes: {total}
                        </p>
                        {isAnnounced && (
                          <div className="mb-4 p-3 bg-green-50 rounded">
                            <p className="font-bold text-green-800">Winner:</p>
                            <p className="text-green-700">{result.winnerName}</p>
                            <p className="text-sm text-green-600">
                              {result.winnerDepartment} - {result.winnerYear}
                            </p>
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">
                                Vote Counts:
                              </p>
                              {result.totalVotesPerCandidate.map((c) => (
                                <div
                                  key={c.candidateId}
                                  className={`text-xs ${
                                    c.candidateId === result.winnerId
                                      ? 'font-bold text-green-800'
                                      : 'text-gray-600'
                                  }`}
                                >
                                  {c.name}: {c.votes}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleAnnounceResult(post.name)}
                          disabled={!isAnnounced && total === 0}
                          className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnnounced ? 'Result Announced' : 'Announce Result'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Import Students</h2>
              <div className="mb-6">
                <form onSubmit={handleCSVUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      CSV format: registerNo, name, Password, year, department
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !csvFile}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Importing...' : 'Import CSV'}
                  </button>
                </form>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Add Single Student</h3>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Register Number
                      </label>
                      <input
                        type="text"
                        value={newStudent.registerNo}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, registerNo: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newStudent.name}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, name: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newStudent.password}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, password: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year
                      </label>
                      <input
                        type="text"
                        value={newStudent.year}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, year: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={newStudent.department}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, department: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Student'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Add Candidate</h2>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newCandidate.name}
                      onChange={(e) =>
                        setNewCandidate({ ...newCandidate, name: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post
                    </label>
                    <select
                      value={newCandidate.post}
                      onChange={(e) =>
                        setNewCandidate({ ...newCandidate, post: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Post</option>
                      {posts.map((post) => (
                        <option key={post._id} value={post.name}>
                          {post.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newCandidate.department}
                      onChange={(e) =>
                        setNewCandidate({ ...newCandidate, department: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      value={newCandidate.year}
                      onChange={(e) =>
                        setNewCandidate({ ...newCandidate, year: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manifesto
                    </label>
                    <textarea
                      value={newCandidate.manifesto}
                      onChange={(e) =>
                        setNewCandidate({ ...newCandidate, manifesto: e.target.value })
                      }
                      required
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photo URL (optional)
                    </label>
                    <input
                      type="text"
                      value={newCandidate.photoUrl}
                      onChange={(e) =>
                        setNewCandidate({ ...newCandidate, photoUrl: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Candidate' : 'Add Candidate')}
                </button>
              </form>

              <div className="mt-6">
                <h3 className="text-xl font-bold mb-4">Manage Candidates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidates.map((c) => (
                    <div key={c._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{c.name}</h4>
                          <p className="text-sm text-gray-600">{c.post} • {c.department} • {c.year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Votes</p>
                          <p className="font-semibold">{c.votes ?? 0}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">{c.manifesto?.slice(0, 160)}{c.manifesto && c.manifesto.length > 160 ? '...' : ''}</p>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleEditCandidate(c)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCandidate(c._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

