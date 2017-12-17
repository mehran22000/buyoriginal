var express = require('express');
var router = express.Router();
var apnsComm = require('./apnsComm');

/*
 * Apps
 */
 router.get('/version/:device', function(req, res) {
    var db = req.db;
    var device = req.params.device;
    db.collection('app_version').findOne({device:device.toString()},function (err, doc) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(doc);
    });
});


module.exports = router;
