var express = require('express');
var router = express.Router();
var apnsComm = require('./apnsComm');

/*
 * Apps
 */
 router.get('/version/:device', function(req, res) {
    var db = req.db;
    var device = req.params.device;
    db.collection('app_version').find({device:device.toString()}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});


module.exports = router;
