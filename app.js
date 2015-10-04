


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://mehran22000:mehrdad781@ds039020.mongolab.com:39020/heroku_app37328797", {native_parser:true});

var routes = require('./routes/index');
var users = require('./routes/users');
var brands = require('./routes/brands');
var stores = require('./routes/stores');
var categories = require('./routes/categories');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/brands',brands);
app.use('/stores',stores);
app.use('/categories',categories);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



var passport = require('passport')    
var BasicStrategy = require('passport-http').BasicStrategy

passport.use(new BasicStrategy(
  function(username, password, done) {
    if (username.valueOf() === 'yourusername' &&
      password.valueOf() === 'yourpassword')
      return done(null, true);
    else
      return done(null, false);
  }
));

// Express-specific configuration section
// *IMPORTANT*
//   Note the order of WHERE passport is initialized
//   in the configure section--it will throw an error
//   if app.use(passport.initialize()) is called after
//   app.use(app.router) 
app.configure(function(){
  app.use(express.cookieParser());
  app.use(express.session({secret:'123abc',key:'express.sid'}));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(passport.initialize());
  app.use(app.router);
  app.use(logger);
});

// Routes

app.get('/', passport.authenticate('basic', { session: false }), routes.index);
app.get('/partials/:name', routes.partials);

// JSON API

app.get('/api/posts', passport.authenticate('basic', { session: false }), api.posts);
app.get('/api/post/:id', passport.authenticate('basic', { session: false }), api.post)
// --Repeat for every API call you want to protect with basic auth--

app.get('*', passport.authenticate('basic', { session: false }), routes.index);


//-----------------------------------------------------------------------------------------------------------

module.exports = app;