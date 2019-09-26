const express = require('express');
const bcrypt = require('bcrypt');
const models = require('../models');
const session = require('./session');

const router = express.Router();
const Op = models.Sequelize.Op;

router
  .route('/session')
  .get(session.loggedIn, (req, res) =>{
    if(req.session && req.session.user){
      let filteredUser = {
        id: req.session.user.UID,
        username: req.session.user.username,
        email: req.session.user.email,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        createdAt: req.session.user.createdAt,
        updatedAt: req.session.user.updatedAt,
        sessionAge: req.session.cookie.maxAge
      }
      res.json({user: filteredUser});
      console.log('session for ' + req.session.user.username + ' is still valid');
    }
    else{
      res.status(302).send('/Login');
    }
  });

router
  .route('/login')

  .post(session.notLoggedIn, (req, res) => {
    models.user
      .findOne({
        where: {
          [Op.or]: [{ username: req.body.username }, { email: req.body.username }],
        },
      })
      .then(user => {
        bcrypt.compare(req.body.password, user.password, (err, result) => {
          if (result) {
            console.log('User ' + user.username + ' has logged in');
            console.log('Creating cookie for ' + user.username + ' that expires on: ' + req.session.cookie.expires
              + ' = ' + req.session.cookie.maxAge/1000 + ' seconds of being idle');
            let filteredUser = {
              id: user.UID,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              sessionAge: req.session.cookie.maxAge
            }
            req.session.user = filteredUser;
            res.json({ auth: true, user: filteredUser });
          } else {
            res.status(400);
            res.json({ auth: false, msg: "invalid username/password combination" });
          }
        });
      })
      .catch(err => {
        res.status(400);
        res.json({ auth: false, msg: "invalid username/password combination" });
      });
  });

router
  .route('/logout')
  .get(session.loggedIn, (req, res) => {
    let username = req.session.user.username;
    req.session.destroy((err)=>{
      if(!err){
        console.log('User ' + username + ' has logged out');
        res.sendStatus(200);
      }
    });
  });

module.exports = router;
