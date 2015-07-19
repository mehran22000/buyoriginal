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


router.get('/business/login', function(req, res) {
    var db = req.db;
    var email = req.body.email;
    var password = req.body.password;
    
    var array = [{ "result": "successful"}];
    res.json(array);
    // res.send(JSON.stringify({ "result": "successful"}));
    
    /*
    db.collection('business_users').find({buEmail:email.toString()}).toArray(function (err, doc) {
        if (doc.length==0){
        	res.send(JSON.stringify({ "result": "err_invalid_email"}));
        }
        else {
        	if (doc.buPassword==password){
        	   res.send(JSON.stringify({ "result": "successful"}));
        	}
        	else {
        		res.send(JSON.stringify({ "result": "err_incorrect_password"}));
        	}
        }
    });
    */     
});



 
router.post('/business/adduser', function(req, res) {
    console.log('/business/adduser');
    var db = req.db;
    
    var newUser = {
        		'buId': req.body.buId,
        		'buEmail':req.body.buEmail,
        		'buPassword':req.body.buPassword,
        		'buCity':req.body.buCity,
        		'buBrandId':req.body.buBrandId,
        		'buBrandName':req.body.buBrandName,
        		'buStoreName':req.body.buStoreName,
        		'buStoreAddress':req.body.buStoreAddress,
        		'buStoreHours':req.body.buStoreHours,
        		'buDistributor':req.body.buDistributor,
        		'buStoreLat':req.body.buStoreLat,
        		'buStoreLon':req.body.buStoreLon,
        		'buAreaCode':req.body.buAreaCode,
        		'buTel':req.body.buTel
    }
    
    db.collection('business_users').insert(newUser, function(err, result){
        	if (err === null) {
        		console.log('new user doc added');
        	}
        	res.send(
            	(err === null) ? { msg: '' } : { msg: err }
        		);
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
