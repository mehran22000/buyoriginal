var express = require('express');
var router = express.Router();

/*
 * Business Users
 */
 router.get('/business/userlist', function(req, res) {
    var db = req.db;
    db.collection('business_users').find().toArray(function (err, items) {
        res.json(items);
    });
});

router.get('/business/validateemail/:email', function(req, res) {
    var db = req.db;
    var email = req.params.email;
    db.collection('business_users').find({buEmail:email.toString()}).toArray(function (err, items) {
        if (items.length==0){
        	res.send(JSON.stringify({ "duplicate": "false"}));
        }
        else {
        	res.send(JSON.stringify({ "duplicate": "true"}));
        }
    });
});

 





/*
 * GET userlist.
 */
router.get('/userlist', function(req, res) {
    var db = req.db;
    db.collection('userlist').find().toArray(function (err, items) {
        res.json(items);
    });
});

/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
    var db = req.db;
    db.collection('userlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deleteuser/:id', function(req, res) {
    var db = req.db;
    var userToDelete = req.params.id;
    db.collection('userlist').removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
