var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var mongoClient = Promise.promisifyAll(require('mongodb')).MongoClient;
 
router.post('/register', function(req, res) {
    console.log('/profiles/register');
	var _db;
	var newProfile =  {'username':req.body.username, 
					   'password':req.body.password,
					   'city':req.body.city,
					   'age':req.body.age,
					   'photo':req.body.photo,
					   'gender':req.body.gender,
					   'lat':req.body.lat,
					   'lon':req.body.lon}
	
	mongoClient.connectAsync(req.dburl)  
    .then(function(db) {       // Verify the user does not exist
        _db = db;
        return _db.collection('profiles').findOneAsync({username:req.body.username})
    })
    .then(function(user) {
    	 if (!user){    		
    		console.log('user: '+ req.body.username + ' registered')
    		return _db.collection('profiles').insertAsync(newProfile) // Insert the modified user
    	}
    	else {
    		console.log('user: '+ req.body.username + ' exists')
    		res.status(404).send({ "status": "failed","errorCode":"501","error":"username exists"});
    		return false;
    	}
    	
    })
	.then(function(result) {
    	if (result){
    		console.log('user: '+ req.body.username + ' inserted')
    		res.json({ "status": "success"});
    	}
    	else res.send({ "status": "failed","errorCode":"502","error":"insert into database failed"});
    })
    .catch(function(err) {
        throw err;
        return res.send({ "status": "failed","errorCode":"500","error":"generic error"});
    })
    .finally(function() {
    	if (_db) 
    		_db.close();
	});
	
});

router.post('/info', function(req, res) {
    console.log('/info/'+ req.body.username);
	res.set({'Access-Control-Allow-Origin': '*'});
	var db = req.db;
    db.collection('profiles').findOne({'username':req.body.username, 'password':req.body.password}, function(err, user) {
        if (!user){    		
    		console.log('user: '+ req.body.username + ' not found')
    		res.send({"status":"failed","errorCode":"503","error":"username does not exists"});
    	}
    	else {
    		if (user.password === req.body.password) {
    			console.log('user: '+ req.body.username + ' get info successful')
    			res.send({"status":"success","user":user});
    		}
    		else {
    			console.log('user: '+ req.body.username + ' password incorrect')
    			res.send({"status":"failed","errorCode":"504","error":"password is incorrect"})
    		}
    	};
    });   
});

router.post('/login', function(req, res) {
    console.log('/login/'+ req.body.username);
	res.set({'Access-Control-Allow-Origin': '*'});
	var db = req.db;
    db.collection('profiles').findOne({'username':req.body.username}, function(err, user) {
        if (!user){    		
    		console.log('user: '+ req.body.username + ' not found')
    		res.send({"status":"failed","errorCode":"503","error":"username does not exists"});
    	}
    	else {
    		if (user.password === req.body.password) {
    			console.log('user: '+ req.body.username + ' authentication successful')
    			res.send({"status":"success","city":user.city});
    		}
    		else {
    			console.log('user: '+ req.body.username + ' password incorrect')
    			res.send({"status":"failed","errorCode":"504","error":"password is incorrect"})
    		}
    	};
    });   
});


router.get('/forgetpassword/:username', function(req, res) {

    console.log('/profiles/forgetPassword' + req.params.email);
    var postmark = require("postmark");
	var db = req.db;
	var email = req.params.username;
	
	db.collection('profiles').findOne({'username':email}, function(err, user) {
        if (!user){    		
    		console.log('user: '+ req.body.username + ' not found')
    		res.send({"status":"failed","errorCode":"503","error":"username does not exists"});
    	}
    	else {
    		var client = new postmark.Client("0aba8682-68fb-4720-abbc-ae22d778b02b");
    			var eHeader = " سلام " +"\n";
				var eBody1="شناسه:"+ user.username.toString()+"\n";
				var eBody2="رمز عبور:"+ user.password.toString()+"\n";
				var eFooter = "برای اطلاعات بیشتر یا هرگونه سوال و پیشنهاد لطفا با پست الکترونیکی  support@aslbekhar.com تماس بگیرید."+"\n"+"با تشکر"+"\n"+"مدیریت اصل بخر ";
    		
    			client.sendEmail({
    				"From": "passwordrecovery@aslbekhar.com",
    				"To": email.toString(),
    				"Subject": "Aslbekhar.com Password Recovery", 
    				"TextBody": eHeader+"\n"+eBody1+"\n"+eBody2+"\n"+eFooter,
				} , function(error, success) {
    				if(error) {
        				console.error("Unable to send via postmark: " + error.message);
        				console.log("Unable to send via postmark: " + error.message);
        				res.send({"status":"failed","errorCOde":"505", "error":"email was not sent"});
    				}
    				else {
    					console.log("Password was sent!");
    					res.send({"status":"success"});
            		}
    			});
    	};
    }); 	
});


module.exports = router;
