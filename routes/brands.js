var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/brandlist', function(req, res) {
    var db = req.db;
    db.collection('brands').find().toArray(function (err, items) {
        res.json(items);
    });
});

/*
 * POST to adduser.
 */
router.post('/addbrand', function(req, res) {
    var db = req.db;
    db.collection('brandlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deletebrand/:id', function(req, res) {
    var db = req.db;
    var userToDelete = req.params.id;
    db.collection('brandlist').removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
