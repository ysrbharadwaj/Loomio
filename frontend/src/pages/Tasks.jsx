import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed, assigned_to_me
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium'
  });
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    submission_link: '',
    submission_notes: ''
  });
  const [reviewForm, setReviewForm] = useState({
    action: 'approve',
    review_notes: ''
  });

  useEffect(() => {
    // Set default community if user has communities
    if (user?.communities && user.communities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(user.communities[0]);
    }
  }, [user, selectedCommunity]);

  useEffect(() => {
    if (selectedCommunity) {
      fetchTasks();
      // Check if user is admin of the selected community
      const userCommunityRole = selectedCommunity.UserCommunity?.role;
      if (userCommunityRole === 'community_admin' || user?.role === 'platform_admin') {
        fetchCommunityMembers();
      }
    }
  }, [filter, selectedCommunity]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!selectedCommunity) {
        setTasks([]);
        setIsLoading(false);
        return;
      }
      
      let url = '/tasks';
      const params = new URLSearchParams();
      
      // Always include community_id
      params.append('community_id', selectedCommunity.community_id);
      
      if (filter === 'pending') {
        params.append('status', 'pending');
      } else if (filter === 'completed') {
        params.append('status', 'completed');
      } else if (filter === 'assigned_to_me') {
        params.append('assigned_to', user.user_id);
      }
      
      url += `?${params.toString()}`;
      
      const response = await api.get(url);
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunityMembers = async () => {
    try {
      if (!selectedCommunity?.community_id) return;
      
      const response = await api.get(`/communities/${selectedCommunity.community_id}/members`);
      setCommunityMembers(response.data.members || []);
    } catch (error) {
      console.error('Failed to fetch community members:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!createForm.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!selectedCommunity?.community_id) {
      setError('Please select a community to create tasks');
      return;
    }

    // Check if user is admin of selected community
    const userCommunityRole = selectedCommunity.UserCommunity?.role;
    if (userCommunityRole !== 'community_admin' && user?.role !== 'platform_admin') {
      setError('Only community administrators can create tasks');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const taskData = {
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        community_id: selectedCommunity.community_id
      };

      if (createForm.assigned_to) {
        taskData.assignee_ids = [parseInt(createForm.assigned_to)];
      }

      if (createForm.due_date) {
        taskData.deadline = createForm.due_date;
      }

      const response = await api.post('/tasks', taskData);
      setSuccess(`Task "${response.data.task.title}" created successfully!`);
      setCreateForm({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium'
      });
      setShowCreateForm(false);
      fetchTasks();
    } catch (err) {
      console.error('Task creation error:', err);
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => 
        prev.map(task => 
          task.task_id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
      setError('Failed to update task status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelfAssign = async (taskId) => {
    try {
      setIsLoading(true);
      const response = await api.post(`/tasks/${taskId}/self-assign`);
      setSuccess(response.data.message);
      fetchTasks();
    } catch (err) {
      console.error('Self-assign error:', err);
      setError(err.response?.data?.message || 'Failed to self-assign task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await api.post(`/tasks/${selectedTask.task_id}/submit`, submissionForm);
      setSuccess(response.data.message);
      setSubmissionForm({ submission_link: '', submission_notes: '' });
      setShowSubmissionModal(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Submit task error:', err);
      setError(err.response?.data?.message || 'Failed to submit task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewTask = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await api.post(`/tasks/${selectedTask.task_id}/review`, reviewForm);
      setSuccess(response.data.message);
      setReviewForm({ action: 'approve', review_notes: '' });
      setShowReviewModal(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Review task error:', err);
      setError(err.response?.data?.message || 'Failed to review task');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'submitted':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'not_started':
        return <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const canCreateTasks = () => {
    if (user?.role === 'platform_admin') return true;
    if (!selectedCommunity) return false;
    return selectedCommunity.UserCommunity?.role === 'community_admin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tasks
              </h1>
              <p className="text-gray-600">
                Manage your tasks and achieve your goals
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {canCreateTasks() && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Task
                </button>
              )}
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">{success}</div>
          </div>
        )}

        {/* Community Selector and Filter Tabs */}
        <div className="space-y-4">
          {/* Community Selector */}
          {user?.communities && user.communities.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <label htmlFor="community-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Community
              </label>
              <select
                id="community-select"
                value={selectedCommunity?.community_id || ''}
                onChange={(e) => {
                  const communityId = parseInt(e.target.value);
                  const community = user.communities.find(c => c.community_id === communityId);
                  setSelectedCommunity(community);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a community...</option>
                {user.communities.map((community) => (
                  <option key={community.community_id} value={community.community_id}>
                    {community.name} ({community.UserCommunity?.role === 'community_admin' ? 'Admin' : 'Member'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border p-1">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Tasks' },
                { key: 'assigned_to_me', label: 'Assigned to Me' },
                { key: 'pending', label: 'Pending' },
                { key: 'completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!user?.communities || user.communities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Communities Found</h3>
            <p className="text-gray-600 mb-6">You need to be part of a community to view and manage tasks.</p>
            <button
              onClick={() => window.location.href = '/communities'}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Join a Community
            </button>
          </div>
        ) : !selectedCommunity ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Community</h3>
            <p className="text-gray-600 mb-6">Please select a community above to view and manage tasks.</p>
          </div>
        ) : (
          /* Tasks List */
          <div className="bg-white rounded-xl shadow-sm border">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' 
                    ? "No tasks have been created yet."
                    : `No ${filter.replace('_', ' ')} tasks found.`
                  }
                </p>
                {canCreateTasks && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tasks.map((task) => {
                  const userAssignment = task.assignees?.find(a => a.user_id === user.user_id);
                  const isAssignedToUser = !!userAssignment;
                  const canSelfAssign = !isAssignedToUser && task.status === 'not_started';
                  const canSubmit = isAssignedToUser && ['accepted', 'in_progress'].includes(userAssignment.TaskAssignment?.status);
                  const canReview = task.status === 'submitted' && selectedCommunity?.UserCommunity?.role === 'community_admin';
                  
                  return (
                    <div key={task.task_id} className="p-6 hover:bg-gray-50 transition-colors border-l-4 border-l-transparent hover:border-l-primary-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {task.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority} priority
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-gray-700 mb-3">{task.description}</p>
                            )}

                            {/* Assignees */}
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-2">
                                  {task.assignees.map((assignee) => (
                                    <span key={assignee.user_id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      <UserIcon className="w-3 h-3 mr-1" />
                                      {assignee.full_name}
                                      {assignee.TaskAssignment?.status && (
                                        <span className="ml-1 text-blue-600">({assignee.TaskAssignment.status})</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Submission info */}
                            {task.status === 'submitted' && (
                              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800 font-medium">Task submitted for review</p>
                                {task.submission_notes && (
                                  <p className="text-sm text-yellow-700 mt-1">{task.submission_notes}</p>
                                )}
                                {task.submission_link && (
                                  <a href={task.submission_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                    View submission →
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Review info */}
                            {['completed', 'rejected'].includes(task.status) && task.review_notes && (
                              <div className={`mb-3 p-3 border rounded-lg ${task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-green-800' : 'text-red-800'}`}>
                                  Admin Review: {task.status === 'completed' ? 'Approved' : 'Rejected'}
                                </p>
                                <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-green-700' : 'text-red-700'}`}>
                                  {task.review_notes}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                <span>Due: {formatDate(task.deadline)}</span>
                              </div>
                              <span>Created {formatDate(task.created_at)}</span>
                              {task.completed_at && (
                                <span>Completed {formatDate(task.completed_at)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Task Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {canSelfAssign && (
                            <button
                              onClick={() => handleSelfAssign(task.task_id)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors"
                            >
                              Self Assign
                            </button>
                          )}
                          
                          {canSubmit && (
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowSubmissionModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition-colors"
                            >
                              Submit Task
                            </button>
                          )}
                          
                          {canReview && (
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowReviewModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-colors"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h3>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                    placeholder="Describe the task..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To
                    </label>
                    <select
                      value={createForm.assigned_to}
                      onChange={(e) => setCreateForm({ ...createForm, assigned_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Unassigned</option>
                      {communityMembers.map((member) => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={createForm.due_date}
                      onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Submission Modal */}
        {showSubmissionModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Task: {selectedTask.title}</h3>
              
              <form onSubmit={handleSubmitTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.submission_link}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, submission_link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/proof-of-completion"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Notes
                  </label>
                  <textarea
                    value={submissionForm.submission_notes}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, submission_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
                    placeholder="Describe what you've completed, any challenges faced, or additional notes..."
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionModal(false);
                      setSelectedTask(null);
                      setSubmissionForm({ submission_link: '', submission_notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Review Modal */}
        {showReviewModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Review Task: {selectedTask.title}</h3>
              
              {/* Task Submission Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Submission Details</h4>
                {selectedTask.submission_notes && (
                  <p className="text-gray-700 mb-2">{selectedTask.submission_notes}</p>
                )}
                {selectedTask.submission_link && (
                  <a 
                    href={selectedTask.submission_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View submission link →
                  </a>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Submitted: {formatDate(selectedTask.submitted_at)}
                </p>
              </div>
              
              <form onSubmit={handleReviewTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Decision
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="approve"
                        checked={reviewForm.action === 'approve'}
                        onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-green-700 font-medium">Approve and mark as completed</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="reject"
                        checked={reviewForm.action === 'reject'}
                        onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-red-700 font-medium">Reject and request resubmission</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewForm.review_notes}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                    placeholder="Provide feedback to the task assignee..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedTask(null);
                      setReviewForm({ action: 'approve', review_notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      reviewForm.action === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isLoading ? 'Processing...' : (reviewForm.action === 'approve' ? 'Approve Task' : 'Reject Task')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;