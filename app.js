'use strict';

const express =  require('express')
  , passport = require('passport')
  , util =  require('util')
  , uuid = require('node-uuid')
  , FacebookStrategy = require('passport-facebook').Strategy
  , session = require('express-session')
  , cookieParser =  require('cookie-parser')
  , bodyParser =  require('body-parser')
  , config  =  require('./config')
  , mysql  =  require('mysql')
  , fileUpload = require('express-fileupload')
  , path = require('path')
  , pug = require('pug')
  , sendrid = require('./sendgrid.js')
  , mongoose = require('mongoose')
  , User = require("./models/user.js").User
  , app = express();


mongoose.connect(process.env.MONGO_URL);

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_API_KEY,
    clientSecret: process.env.FACEBOOK_API_SECRET ,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email', 'name']
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));




app.engine('ejs', require('express-ejs-extend')); // add this line
app.set('view engine', 'ejs');
//app.set('view engine', 'pug')
app.set('views', __dirname + '/views');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(fileUpload());
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index', {user: req.user });
});


/* FACEBOOK CONNECT URLS */
app.get('/connect', function(req, res){
  if(req.user){
    req.session.fb_user = req.user
    User.find({ fbid: req.user.id }, function(err, u) {
      if (err) throw err;
      if(u.length>0) {
        res.render('message', {
          title: "Error",
          message: "user already registered!"
        });
      } else {
        new User({
          first_name: req.user._json.first_name,
          last_name: req.user._json.first_name,
          email: req.user._json.email,
          fbid: req.user._json.id
        }).save(function(err) {
          if (err) throw err;
          sendrid.sendEmail(
            config.user_email_from,
            req.user._json.email,
            config.user_email_subject,
            'Thank you for your registration!'
          )
          console.log('User created!');
          res.redirect('/thanks');
          //res.render('thanks', {user: req.user });
        });
      }
    });
  } else {
    res.render('connect', {user: req.user });
  }
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

app.get('/auth/facebook/callback',passport.authenticate('facebook', { successRedirect : '/connect', failureRedirect: '/login' }), function(req, res) {
  res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// UPLOAD
app.post('/upload', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  let upload = req.files.upload;
  let filename = uuid.v4() + path.extname(req.files.upload.name)
  upload.mv(path.join(process.env.PWD, '/uploads/', filename), function(err) {
    if (err)
      return res.status(500).send(err);
    res.send('File uploaded!');
  });
});

/* THAN YOU PAGE */
app.get('/thanks', function(req, res){
  res.render('thanks', { user: req.session.fb_user });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

/* TEST URLS */
app.get('/test/email', function(req, res){
  sendrid.sendEmail(
    'test@incode.it',
    'molinari@incode.it',
    'redboats - test email',
    'this is a test email....'
  )
  res.send("sent test email");
});

app.get('/test/db', function(req, res){
  var test_user = new User({
    firstname: 'firtname',
    lastname: 'lastname',
    email: 'test@incode.it',
    fbid: '12345678'
  });
  test_user.save(function(err) {
    if (err) throw err;
    console.log('User created!');
  });
  res.send("testing db");
});

/* LISTINING TO PORT... */
app.listen(3000);
