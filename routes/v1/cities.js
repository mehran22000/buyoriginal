var express = require('express');
var router = express.Router();
var gcm = require('node-gcm');

/*
 * Cities
 */
 router.get('/', function(req, res) {
    var db = req.db;
    db.collection('cities').find().toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});


module.exports = router;
