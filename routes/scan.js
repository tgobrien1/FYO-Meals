const express = require('express');
const { lookupStudent } = require('../services/csgwebadmin');
const { logScan } = require('../services/googleSheets');
const router = express.Router();
 
// Middleware to ensure authentication
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};
 
router.post('/', requireAuth, async (req, res) => {
  const { rfidId } = req.body;
  
  if (!rfidId) {
    return res.status(400).json({ success: false, error: 'No RFID ID provided' });
  }
  
  try {
    const student = await lookupStudent(rfidId);
    const success = !!student;
    
    // Log the scan attempt
    await logScan(student, success, req.user);
    
    if (success) {
      res.json({ success: true, student });
    } else {
      res.json({ success: false, error: 'Student not found' });
    }
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ success: false, error: 'System error' });
  }
});
 
module.exports = router;
