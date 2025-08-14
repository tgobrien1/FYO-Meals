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
 
// ===================================
// services/googleSheets.js
// ===================================
const { google } = require('googleapis');
const fs = require('fs');
 
let sheets = null;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

async function initializeGoogleSheets() {
  try {
    if (!SPREADSHEET_ID) {
      console.log('⚠️  Google Sheets not configured - will log to CSV file instead');
      return;
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    sheets = google.sheets({ version: 'v4', auth });
    
    // Test the connection
    await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    console.log('✅ Google Sheets connected successfully');
    
    // Ensure headers exist
    await ensureHeaders();
    
  } catch (error) {
    console.log('⚠️  Google Sheets setup failed, using local CSV:', error.message);
    sheets = null;
  }
}

async function ensureHeaders() {
  if (!sheets) return;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:F1'
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1:F1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Date', 'Time', 'Student Name', 'Andrew ID', 'Status', 'Scanned By']]
        }
      });
      console.log('📊 Added headers to Google Sheet');
    }
  } catch (error) {
    console.error('Error setting up headers:', error);
  }
}

async function logScan(studentData, success, user) {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  
  const rowData = [
    date,
    time,
    studentData ? studentData.name : 'Unknown',
    studentData ? studentData.andrewid : 'N/A',
    success ? 'SUCCESS' : 'FAILURE',
    user ? user.name : 'Unknown'
  ];
  
  try {
    if (sheets && SPREADSHEET_ID) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:F',
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      });
      console.log('📝 Logged to Google Sheets:', rowData);
    } else {
      // Fallback to CSV
      const csvHeader = 'Date,Time,Student Name,Andrew ID,Status,Scanned By\n';
      const csvRow = rowData.map(field => `"${field}"`).join(',') + '\n';
      
      if (!fs.existsSync('scan-log.csv')) {
        fs.writeFileSync('scan-log.csv', csvHeader);
      }
      fs.appendFileSync('scan-log.csv', csvRow);
      console.log('📝 Logged to CSV:', rowData);
    }
  } catch (error) {
    console.error('❌ Logging error:', error);
  }
}
 
module.exports = { initializeGoogleSheets, logScan };
