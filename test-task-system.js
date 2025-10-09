/**
 * Test script to verify the enhanced task system
 * - Tests deadline enforcement
 * - Tests points awarding
 * - Tests task workflow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testUser = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';
let testCommunity = null;
let testTask = null;

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return response.data.user;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function createTestCommunity() {
  try {
    const response = await axios.post(`${BASE_URL}/communities`, {
      name: 'Test Community for Tasks',
      description: 'Testing task system functionality'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testCommunity = response.data;
    console.log('✅ Test community created:', testCommunity.name);
    return testCommunity;
  } catch (error) {
    console.error('❌ Community creation failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function createTestTask(withPastDeadline = false) {
  try {
    const deadline = withPastDeadline 
      ? new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    
    const response = await axios.post(`${BASE_URL}/tasks`, {
      title: withPastDeadline ? 'Overdue Test Task' : 'Test Task',
      description: 'Testing task system functionality',
      community_id: testCommunity.community_id,
      deadline: deadline.toISOString()
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testTask = response.data;
    console.log(`✅ Test task created: ${testTask.title} (deadline: ${deadline.toLocaleString()})`);
    return testTask;
  } catch (error) {
    console.error('❌ Task creation failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function selfAssignTask() {
  try {
    const response = await axios.post(`${BASE_URL}/tasks/${testTask.task_id}/self-assign`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Self-assigned to task');
    return response.data;
  } catch (error) {
    console.error('❌ Self-assignment failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function acceptTask() {
  try {
    const response = await axios.put(`${BASE_URL}/tasks/${testTask.task_id}/status`, {
      status: 'accepted'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Task accepted');
    return response.data;
  } catch (error) {
    console.error('❌ Task accept failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function startWorkingOnTask() {
  try {
    const response = await axios.put(`${BASE_URL}/tasks/${testTask.task_id}/status`, {
      status: 'in_progress'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Started working on task');
    return response.data;
  } catch (error) {
    console.error('❌ Start working failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function submitTask() {
  try {
    const response = await axios.put(`${BASE_URL}/tasks/${testTask.task_id}/submit`, {
      submission_notes: 'Test submission for deadline and points verification',
      submission_link: 'https://example.com/proof'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Task submitted');
    return response.data;
  } catch (error) {
    console.error('❌ Task submission failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function reviewTask(approve = true) {
  try {
    const response = await axios.put(`${BASE_URL}/tasks/${testTask.task_id}/review`, {
      status: approve ? 'completed' : 'rejected',
      review_notes: approve ? 'Great work! Task completed successfully.' : 'Needs improvement.'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Task ${approve ? 'approved' : 'rejected'}`);
    return response.data;
  } catch (error) {
    console.error('❌ Task review failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function checkUserPoints() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`📊 User points: ${response.data.points}`);
    return response.data.points;
  } catch (error) {
    console.error('❌ Failed to check user points:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting task system tests...\n');
  
  try {
    // Login
    const user = await login();
    console.log(`Logged in as: ${user.full_name} (${user.role})\n`);
    
    // Check initial points
    const initialPoints = await checkUserPoints();
    console.log('');
    
    // Test 1: Normal task workflow with points awarding
    console.log('📋 Test 1: Normal task workflow');
    await createTestCommunity();
    await createTestTask(false); // Future deadline
    await selfAssignTask();
    await acceptTask();
    await startWorkingOnTask();
    await submitTask();
    await reviewTask(true); // Approve task
    
    const pointsAfterCompletion = await checkUserPoints();
    const pointsEarned = pointsAfterCompletion - initialPoints;
    console.log(`✅ Points earned: ${pointsEarned} (expected: 10)\n`);
    
    // Test 2: Deadline enforcement
    console.log('📋 Test 2: Deadline enforcement');
    await createTestTask(true); // Past deadline
    await selfAssignTask();
    await acceptTask();
    await startWorkingOnTask();
    
    try {
      await submitTask();
      console.log('❌ Submission should have been blocked due to deadline!');
    } catch (error) {
      if (error.response?.data?.message?.includes('deadline')) {
        console.log('✅ Deadline enforcement working correctly');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
runTests().catch(console.error);