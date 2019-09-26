// server.js

// BASE SETUP
// =============================================================================
require('dotenv').config();
// import routes
const routes = require('./app/routes/');
const auth = require('./app/routes/auth');

// call the packages we need
const express = require('express'); // call express
const app = express(); // define our app using express
const bodyParser = require('body-parser');
const session = require('./app/routes/session');

// enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Content-Type', 'application/json');
  next();
});

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session.session);

var port = process.env.PORT || 8080; // set our port

// ROUTES FOR OUR API
// =============================================================================
app.use('/', routes); // Base route
app.use('/auth', auth);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
