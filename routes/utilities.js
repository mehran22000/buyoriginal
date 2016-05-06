var express = require('express');
var router = express.Router();


/*
router.get('/backup/:collection', function(req, res) {
    console.log('/backup');
    var db = req.db;
    var db_dev = req.db_dev;
    var collection=req.params.collection
    
    db.collection(collection).find().toArray(function (err, items) {
    	db.collection('stores_backup_2').remove({}, function(err, result) {
        	if (err == null) {
        		db.collection('stores_backup_2').insert(items, function(err, result){
        			if (err === null) {
        				console.log('backup is completed');
        		}
        		res.set({'Access-Control-Allow-Origin': '*'});
        		res.send((err === null) ? { msg: '' } : { msg: err });
    			})
        	}
    	});  
    });		
});
*/

// analytics_city_sessions
// brand_verification
// brands
// business_users
// categories
// stats
// stores
// user_device
// users_interests

router.get('/copytodev/:collection', function(req, res) {
    console.log('/copytodev');
    var db = req.db;
    var db_dev = req.db_dev;
    var collection=req.params.collection
    
    
    db.collection(collection).find().toArray(function (err, items) {
    	db_dev.collection(collection).remove({}, function(err, result) {
        	if (err == null) {
        		db_dev.collection(collection).insert(items, function(err, result){
        			if (err === null) {
        				console.log('dev copy is completed');
        		}
        		res.set({'Access-Control-Allow-Origin': '*'});
        		res.send((err === null) ? { msg: '' } : { msg: err });
    			})
        	}
    	});  
    });		
});
    


module.exports = router;
