const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
 
function setupPassport() {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
 
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
 
  // SAML Strategy
  passport.use(new SamlStrategy({
    entryPoint: process.env.SAML_ENTRY_POINT || 'https://your-idp.example.com/sso',
    issuer: process.env.SAML_ISSUER || 'rfid-checkin-app',
    callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:3000/auth/saml/callback',
    cert: process.env.SAML_CERT || null, // IDP certificate
    // Dev mode bypass
    acceptedClockSkewMs: -1,
    disableRequestedAuthnContext: true
  }, (profile, done) => {
    // Extract user info from SAML response
    const user = {
      id: profile.nameID || profile['urn:oid:0.9.2342.19200300.100.1.1'] || 'unknown',
      name: profile['urn:oid:2.5.4.3'] || profile.displayName || 'Unknown User',
      email: profile['urn:oid:0.9.2342.19200300.100.1.3'] || profile.email || '',
      andrewId: profile['urn:oid:0.9.2342.19200.100.1.1'] || profile.uid || profile.id
    };
    
    return done(null, user);
  }));
}
 
module.exports = { setupPassport };
