const https = require('https');
 
async function lookupStudent(rfidId) {
  // In development, use mock data
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_CSGWEBADMIN === 'true') {
    return mockLookup(rfidId);
  }
  
  // Real CSGWebAdmin lookup
  try {
    const response = await fetch(`${process.env.CSGWEBADMIN_URL}/api/student/${rfidId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CSGWEBADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`CSGWebAdmin API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      name: data.displayName || data.name,
      andrewid: data.andrewId || data.username
    };
  } catch (error) {
    console.error('CSGWebAdmin lookup error:', error);
    throw error;
  }
}
async function mockLookup(rfidId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const mockStudents = {
    '1234567890': { name: 'John Doe', andrewid: 'jdoe' },
    '9876543210': { name: 'Jane Smith', andrewid: 'jsmith' },
    '5555555555': { name: 'Bob Johnson', andrewid: 'bjohnson' },
    '1111111111': { name: 'Alice Cooper', andrewid: 'acooper' },
    '2222222222': { name: 'Charlie Brown', andrewid: 'cbrown' }
  };
  
  return mockStudents[rfidId] || null;
}
 
module.exports = { lookupStudent };
