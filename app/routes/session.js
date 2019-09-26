const Session = require('express-session');

// Sessions config
// The duration to extend sessions by when they're about to expire (below kSessionExpireThreshold)
//const kDefaultExtendDurationMS = 1000 * 60 * 1; // duration to extend sessions

// Sessions with less than 5 minutes left will be extended by kDefaultExtendDurationMS upon receiving
// any activity from the user
//const kSessionExpireThreshold = 1000 * 30; 

// The initial duration of a session.
const kInitialSessionDurationMS = 1000 * 60 * 60 * 2; // 2 hours

const opts = {
  secret: "random string",
  name: "connect.sid",
  resave: false,
  saveUninitialized: false,
  rolling: true,  // will refresh the session everytime we receive req from user
  cookie: {maxAge: kInitialSessionDurationMS, httpOnly: true}
}

const sessionInstance = new Session(opts);

module.exports = {
  session: sessionInstance,

  // Extends user's session if it expires in less than threshold (kSessionExpireThreshold)
  // extendDuration: (req) => {
  //   if(req.session && req.session.cookie && req.session.cookie.maxAge < kSessionExpireThreshold){
  //     req.session.cookie.maxAge = kDefaultExtendDurationMS;
  //     console.log('refreshing ' + req.session.user.username  + 'cookie. Expires on: ' + req.session.cookie.expires);
  //   }      
  // },
  // middleware to redirect users that are not logged in
  loggedIn: (req, res, next) => {
    if(req.session.user){
      next();
    }
    else{
      console.log('redirecting to /Login');
      res.status(302);
      res.send("/Login");
    }
  },
  // middleware that redirects logged in users
  notLoggedIn: (req, res, next) => {
    if(!req.session.user){
      next();
    }
    else{
      console.log('redirecting to /Home');
      res.status(302).send('/Home')
    }
  }
}