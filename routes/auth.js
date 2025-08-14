const express = require('express');
const passport = require('passport');
const router = express.Router();
 
// Mock login for development
router.get('/login', (req, res) => {
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_AUTH === 'true') {
    // Mock authentication for dev
    req.login({
      id: 'dev-user',
      name: 'Dev User',
      email: 'dev@example.com',
      andrewId: 'devuser'
    }, (err) => {
      if (err) return res.status(500).send('Login failed');
      return res.redirect('/');
    });
  } else {
    // Redirect to SAML SSO
    passport.authenticate('saml')(req, res);
  }
});
 
// SAML callback
router.post('/saml/callback', 
  passport.authenticate('saml', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.redirect('/');
  }
);
 
// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send('Logout failed');
    res.redirect('/auth/login');
  });
});
 
module.exports = router;
