var express = require('express');
var router = express.Router();

/*
 * GET storelist.
 */
router.get('/storelist', function(req, res) {
    var db = req.db;
    db.collection('stores').find().toArray(function (err, items) {
        res.json(items);
    });
});


/*
 * GET storelist by Id.
 */
router.get('/storelist/:id', function(req, res) {
    var db = req.db;
    console.log(req.params.id);
    db.collection('stores').find({bId:req.params.id}).toArray(function (err, items) {
        res.json(items);
    });
});

router.get('/storelist/:id/:lat/:lon/:km', function(req, res) {
    var db = req.db;
    var items = [];
    console.log(req.params.id);
    db.collection('stores').find({bId:req.params.id}).toArray(function (err, stores) {

    	stores.forEach(function(store) {
    		console.log("lat"+req.params.lat);
    		console.log("lon"+req.params.lon);
    		var dist = distance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    		console.log(req.params.dist);
    		if (dist < req.params.km)
    			items.push(store);
    	});
        res.json(items);
    });
});



function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var radlon1 = Math.PI * lon1/180
	var radlon2 = Math.PI * lon2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}       


/*
 * POST to adduser.
 */
router.post('/addstore', function(req, res) {
    console.log('/addstore');
    var db = req.db;
    
    // Find CategoryId
    var _bId = req.body.bId;
    console.log('_bId:'+_bId);
  	
	db.collection('brands').findOne({bId:_bId.toString()},function (err,doc) {
    if (doc){
        var _cId = doc.bCategoryId;
        var _bName = doc.bName;
        console.log('_cId:'+_cId);
        console.log('_bName:'+_bName);
        db.collection('categories').findOne({cId:_cId.toString()},function (err,doc) {
        if (doc){
            var _cName=doc.cName;
        	console.log('_cName:'+_cName);
        	var newStore = {
        		'bId': req.body.bId,
        		'sId':req.body.sId,
        		'sName':req.body.sName,
        		'bName':_bName,
        		'bCategory':_cName,
        		'bDistributor':req.body.bDistributor,
        		'sCity':req.body.sCity,
        		'sAddress':req.body.sAddress,
        		'sHours':req.body.sHours,
        		'sAreaCode':req.body.sAreaCode,
        		'sTel1':req.body.sTel1,
        		'sTel2':req.body.sTel2,
        		'sLat':req.body.sLat,
        		'sLong':req.body.sLong,
        		'sVerified':req.body.sVerified
    		}
        	
        	db.collection('stores').insert(newStore, function(err, result){
        	if (err === null) {
        		console.log('new store doc added');
        	}
        	res.send(
            	(err === null) ? { msg: '' } : { msg: err }
        		);
    		});	
        }
        else {
        	console.log('err'+err);
        	}
        });
    } 
    else {
        console.log('err'+err);
    	}
	});
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deletestore/:id', function(req, res) {
    var db = req.db;
    var storeToDelete = req.params.id;
    db.collection('stores').removeById(storeToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
