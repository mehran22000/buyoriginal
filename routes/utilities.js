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
    
    var cols = ["ad_displays","analytics_city_sessions","app_version","brand_verification","brands","business_users","categories","new_brand_verification","new_brands","new_categories","new_discounts","new_stores","stats","stores","user_device","users_analytics","users_interests","cities","users_interests_android"];
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




router.get('/addCatIdtoStores', function(req, res) {
    
    console.log('utility addCatIdtoStores invoked');
    
    var db = req.db_dev;
    var storeIndex = 0;
	db.collection('stores').find().toArray(function (err, stores) {
		var size = stores.length;
		console.log(stores);
    	stores.forEach(function(store) {
    		db.collection('categories').findOne({cName:store.bCategory.toString()},function (err,cat) {
    			console.log('cId='+ cat.cId);
    			store['bCategoryId'] = cat.cId;
    			console.log(store);
    			db.collection('stores').remove({_id:store._id}, function(err, result) {
        			if (err == null) {
        				db.collection('stores').insert(store, function(err, result){
        				if (err === null) {
        					console.log('cat ID added to store id' + store._id);
        					}
        				})
        				storeIndex = storeIndex + 1;
        				if (storeIndex === size) {
        					res.set({'Access-Control-Allow-Origin': '*'});
    						res.send((err === null) ? [{ "result": "success"}] : [{ "err": err}]);
        				}
        			}
        		})
        	})
    	});
 	});
 });
 
 
 router.get('/addVerificationFlagToStores', function(req, res) {
    
    console.log('addVerificationFlagToStores invoked');
    
    var db = req.db_dev;
    var verIndex = 0;
    
	db.collection('brand_verification').find().toArray(function (err, verArray) {
		var verSize = verArray.length;
    	verArray.forEach(function(ver) {
    		verIndex = verIndex + 1;
    		console.log('=======verification'+ verIndex);
    		db.collection('stores').find({bId:ver.bId}).toArray(function (err,strArray) {
    			strArray.forEach(function(str) {
    				console.log('sId='+ str.sId);
    				str['verifiationHints'] = 'true';
    				
    				db.collection('stores').remove({_id:str._id}, function(err, result) {
        			if (err == null) {
        				db.collection('stores').insert(str, function(err, result){
        				if (err === null) {
        					console.log(str);
        					console.log('new str is added' + str._id);
        					}
        				})
        				}
        			})
    			});	
    		});
 		});
 	});
 	res.set({'Access-Control-Allow-Origin': '*'});
    res.send({ "result": "success"});
 });
 
 

router.get('/addLocationtoStores', function(req, res) {
    
    console.log('utility addLocation invoked');
    
    var db = req.db;
    var storeIndex = 0;
	db.collection('stores').find().toArray(function (err, stores) {
		var size = stores.length;
		console.log(stores);
    	stores.forEach(function(store) {
    		var coordinates = [store.sLong,store.sLat];
    		var location = {"type":"Point","coordinates":coordinates};
    		store['location'] = location;
    		db.collection('stores').remove({_id:store._id}, function(err, result) {
        			if (err == null) {
        				db.collection('stores').insert(store, function(err, result){
        				if (err === null) {
        					console.log('Location added to store id' + store._id);
        					}
        				})
        				storeIndex = storeIndex + 1;
        				if (storeIndex === size) {
        					res.set({'Access-Control-Allow-Origin': '*'});
    						res.send((err === null) ? [{ "result": "success"}] : [{ "err": err}]);
        				}
        			}
        		})
        	})
    	});
    });
    				


router.get('/missingCatId', function(req, res) {
    
    console.log('missing categoryID invoked');
    
    var db = req.db;
    var storeIndex = 0;
	db.collection('stores').find({ "bCategoryId": { $exists: false} }).toArray(function (err, stores) {
		res.set({'Access-Control-Allow-Origin': '*'});
		res.send(stores);
 	});
 });


module.exports = router;
