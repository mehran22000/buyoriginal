var express = require('express');
var router = express.Router();

/*
 * Stocks
 */
 router.get('/', function(req, res) {
    res.set({'Access-Control-Allow-Origin': '*'});
    res.json({'status':'success','msg':'hello to stocks api'});
});



module.exports = router;
