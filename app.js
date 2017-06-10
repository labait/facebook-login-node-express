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
  , AWS = require('aws-sdk')
  , fs = require('fs')
  , app = express();



//mongoose.connect(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI);



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
  var base_url = req.protocol + '://' + req.get('host');
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
      callbackURL: base_url+"/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'photos', 'email', 'name']
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  ));

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
          last_name: req.user._json.last_name,
          email: req.user._json.email,
          fbid: req.user._json.id,
          image_url: req.session.s3_url
        }).save(function(err) {
          if (err) throw err;

          console.log('User created!');
          // message to user
          sendrid.sendEmail(
            config.user_email_from, //from
            req.user._json.email, //to
            config.user_email_subject, //subject
            'Thank you for your registration!' // body
          )
          // message to user
          sendrid.sendEmail(
            config.staff_email_from, //from
            config.staff_email, //to
            config.staff_email_subject+" "+req.user._json.email, // body
            req.user._json.first_name+" "+req.user._json.last_name+" "+req.session.s3_url // body
          )



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

  let upload1 = req.files.upload1;
  let filename = uuid.v4() + path.extname(req.files.upload1.name)
  AWS.config.update({
    "accessKeyId": process.env.S3_ACCESS_KEY_ID,
    "secretAccessKey": process.env.S3_SECRET_ACCESS_KEY,
    "region": "eu-central-1"
  });

  var s3 = new AWS.S3();
  //var bucketParams = {Bucket: 'redboats'};
  //s3.createBucket(bucketParams)
  var s3Bucket = new AWS.S3( { params: {Bucket: config.s3_bucket_name} } )
  //buf = new Buffer(upload1.data.replace(/^data:image\/\w+;base64,/, ""),'base64');
  var data = {
      Key: filename,
      Body: upload1.data,
      ContentEncoding: 'base64',
      ContentType: upload1.mimetype,
      ACL:'public-read'
  };
  s3Bucket.putObject(data, function(err, data){
    if (err){
      return res.status(500).send(err);
      console.log('Error uploading data: ', data);
    } else {
      req.session.s3_url = config.s3_bucket_base_url+filename;
      console.log('succesfully uploaded the image!');
      res.redirect('/connect');
    }
  });
  /*
  upload1.mv(path.join(process.env.PWD, '/uploads/', filename), function(err) {
    if (err)
      return res.status(500).send(err);
    //res.send('File uploaded!');
    res.redirect('/connect');
  });
  */
});

/* THAN YOU PAGE */
app.get('/thanks', function(req, res){
  if(req.session.fb_user) {
    res.render('thanks', { user: req.session.fb_user });
  } else {
    res.redirect('/');
  }
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
var port = process.env.PORT || 3000;
app.listen(port);
