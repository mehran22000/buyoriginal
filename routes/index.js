var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Buy Original Dashboard' });
});

/* GET brands page. */
router.get('/brandMgm', function(req, res, next) {
  res.render('brandMgm', { title: 'Buy Original - Brands Dashboard' });
});

/* GET categories page. */
router.get('/categoryMgm', function(req, res, next) {
  res.render('categoryMgm', { title: 'Buy Original - Categories Dashboard' });
});



module.exports = router;
