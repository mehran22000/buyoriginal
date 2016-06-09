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

var colCounter = 0;
router.get('/copytodev', function(req, res) {
    console.log('/copytodev');
    var db = req.db;
    var db_dev = req.db_dev;
    
    var cols = ["ad_displays","analytics_city_sessions","app_version","brand_verification","brands","business_users","categories","new_brand_verification","new_brands","new_categories","new_discounts","new_stores","stats","stores","user_device","users_analytics","users_interests"];
    var counter = 0;
    var len = cols.length;
    console.log(len);
    colCounter = 0;
    for (index= 0; index < len; index++) {
    	var col = cols[index];
    	copyCollection(col,req,res,len);
    }		
});
    
function copyCollection(col,req,res,len){
	var db = req.db;
    var db_dev = req.db_dev;
    
	db.collection(col).find().toArray(function (err, items) {
    		db_dev.collection(col).remove({}, function(err, result) {
        		if (err == null) {
        			db_dev.collection(col).insert(items, function(err, result){
        			if (err === null) {
        				console.log(col + ' copy is successful');
        			}
        			else {
        				console.log(col + ' copy is failed' + err);
        			}
        			
        			colCounter = colCounter + 1;
        			if (colCounter === len){
        				res.set({'Access-Control-Allow-Origin': '*'});
        				res.send((err === null) ? { msg: '' } : { msg: err });
        			}
    			})}
        		
    		});  
    });
}

module.exports = router;
