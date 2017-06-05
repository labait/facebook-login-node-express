'use strict';

const express =  require('express')
  , passport = require('passport')
  , util =  require('util')
  , uuid = require('node-uuid')
  , FacebookStrategy = require('passport-facebook').Strategy
  , session = require('express-session')
  , cookieParser =  require('cookie-parser')
  , bodyParser =  require('body-parser')
  , config  =  require('./configuration/config')
  , mysql  =  require('mysql')
  , fileUpload = require('express-fileupload')
  , path = require('path')
  , pug = require('pug')
  , sendrid = require('./sendgrid.js')
  , app = express();

//Define MySQL parameter in Config.js file.
const connection = mysql.createConnection({
  host     : config.host,
  user     : config.username,
  password : config.password,
  database : config.database
});

//Connect to Database only if Config.js parameter is set.

if(config.use_database==='true')
{
    connection.connect();
}

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.

passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      if(config.use_database==='true')
      {
      connection.query("SELECT * from user_info where user_id="+profile.id,function(err,rows,fields){
        if(err) throw err;
        if(rows.length===0)
          {
            console.log("There is no such user, adding now");
            connection.query("INSERT into user_info(user_id,user_name) VALUES('"+profile.id+"','"+profile.username+"')");
          }
          else
            {
              console.log("User already exists in database");
            }
          });
      }
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
  console.log(req.user)
  res.render('index', {user: req.user });
});



app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));


app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

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

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/thanks', function(req, res){
  res.render('thanks');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}


app.get('/test/email', function(req, res){
  sendrid.sendEmail(
    'test@incode.it',
    'molinari@incode.it',
    'redboats - test email',
    'this is a test email....'
  )
  res.send("sent test email");
});

app.listen(3000);
