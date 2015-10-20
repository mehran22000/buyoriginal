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


app.use(function(req, res, next) {
	var auth = require('basic-auth'); 
    var user = auth(req);
    if(req.originalUrl === '/dashboard_brands.html' || req.originalUrl === '/dashboard_categories.html' || req.originalUrl === '/dashboard_discounts.html' || req.originalUrl === '/dashboard_stores.html')
	{
    if (user === undefined || user['name'] !== 'username' || user['pass'] !== 'password') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
		//res.end(req.originalUrl);
        res.end('Unauthorized');
    } else {
        next();
    }
	}else 
	{
        next();
    }
});



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


module.exports = app;
