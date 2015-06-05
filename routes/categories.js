var express = require('express');
var router = express.Router();

/*
 * GET categorylist.
 */
router.get('/categorylist', function(req, res) {
    var db = req.db;
    db.collection('categories').find().toArray(function (err, items) {
        res.json(items);
    });
});

/*
 * POST to adduser.
 */
router.post('/addcategory', function(req, res) {
    var db = req.db;
    db.collection('categories').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deletecategory/:id', function(req, res) {
    var db = req.db;
    var userToDelete = req.params.id;
    db.collection('categories').removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
