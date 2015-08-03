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

/*
 * GET storelist by Area Code.
 */


router.get('/storelist/city/:areacode', function(req, res) {
    var db = req.db;
    console.log(req.params.areacode);
    db.collection('stores').find({sAreaCode:req.params.areacode}).toArray(function (err, items) {
        res.json(items);
    });
});


router.get('/storelist/city/:areacode/:id', function(req, res) {
    var db = req.db;
    console.log(req.params.areacode);
    console.log(req.params.id);
    db.collection('stores').find({sAreaCode:req.params.areacode, bId:req.params.id}).toArray(function (err, items) {
        res.json(items);
    });
});

router.get('/storelist/discounts/all', function(req, res) {
    console.log("/storelist/discounts");
    var db = req.db;
    db.collection('stores').find({sDiscount:{ $gt: 0 }}).toArray(function (err, items) {
        res.json(items);
    });
});

router.get('/storelist/discounts/city/:areacode', function(req, res) {
    var db = req.db;
    console.log(req.params.areacode);
    console.log(req.params.id);
    db.collection('stores').find({sAreaCode:req.params.areacode, sDiscount:{ $gt: 0 }}).toArray(function (err, items) {
        res.json(items);
    });
});


router.get('/storelist/discounts/:lat/:lon/:km', function(req, res) {
    var db = req.db;
    var items = [];
    db.collection('stores').find({sDiscount:{ $gt: 0 }}).toArray(function (err, stores) {
			stores.forEach(function(store) {
    			console.log("lat"+req.params.lat);
    			console.log("lon"+req.params.lon);
    			var dist = distance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    			console.log(dist);
    			if (dist < req.params.km){
    			    var distNum = dist.toFixed(2);
    			    store.distance=distNum.toString();
      			  	items.push(store);
    			}
    		});
    		res.json(items);
    	});
});

// http://localhost:5000/stores/storelist/3/32.637817/51.658522/10
// http://localhost:5000/stores/storelist/all/32.637817/51.658522/10

router.get('/storelist/:bId/:lat/:lon/:km', function(req, res) {
    var db = req.db;
    var items = [];
    var bId = req.params.bId;
	console.log(bId);
	    
    if (isNumeric(bId)){
        console.log("storeID available");
    	db.collection('stores').find({bId:req.params.bId}).toArray(function (err, stores) {
			stores.forEach(function(store) {
    			var dist = distance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    			if (dist < req.params.km){
    			    var distNum = dist.toFixed(2);
    			     store.distance=distNum.toString();
    				items.push(store);
    			}
    		});
    		res.json(items);
    	});
    }
    else {
    	db.collection('stores').find().toArray(function (err, stores) {
			stores.forEach(function(store) {
    			console.log("lat"+req.params.lat);
    			console.log("lon"+req.params.lon);
    			var dist = distance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    			console.log(dist);
    			if (dist < req.params.km){
    			    var distNum = dist.toFixed(2);
    			    store.distance=distNum.toString();
      			  	items.push(store);
    			}
    		});
    		res.json(items);
    	});
    }
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

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
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


router.post('/adddiscount', function(req, res) {
    console.log('/adddiscount');
    var db = req.db;
    
    // Find CategoryId
    var _bId = req.body.bId;
    var _sId = req.body.sId;
    var _startDate = req.body.startDate;
    var _endDate = req.body.endDate;
    var _startDateFa = req.body.startDateFa;
    var _endDateFa = req.body.endDateFa;
    var _precentage = req.body.precentage;
    var _note = req.body.note;
    
    
    console.log('_bId:'+_bId);
    console.log('_sId:'+_sId);
  	console.log('_startDate:'+_startDate);
  	console.log('_endDate:'+_endDate);
  	console.log('_startDateFa:'+_startDateFa);
  	console.log('_endDate:'+_endDateFa);
  	console.log('_precentage:'+_precentage);
  	console.log('_note:'+_note);
  	
  	
  	
	db.collection('stores').findOne({bId:_bId.toString(),sId:_sId.toString()},function (err,doc) {
    if (doc){
    	var newStore = {
        		'bId': doc.bId,
        		'sId':doc.sId,
        		'sName':doc.sName,
        		'bName':doc.bName,
        		'bCategory':doc.cName,
        		'bDistributor':doc.bDistributor,
        		'sCity':doc.sCity,
        		'sAddress':doc.sAddress,
        		'sHours':doc.sHours,
        		'sAreaCode':doc.sAreaCode,
        		'sTel1':doc.sTel1,
        		'sTel2':doc.sTel2,
        		'sLat':doc.sLat,
        		'sLong':doc.sLong,
        		'sVerified':doc.sVerified,
        		'dStartDate': _startDate,
        		'dEndDate': _endDate,
        		'dStartDateFa': _startDateFa,
        		'dEndDateFa': _endDateFa,
        		'dPrecentage': _precentage,
        		'dNote': _note
    	}
    	
    	db.collection('stores').remove({bId:_bId,sId:_sId}, function(err, result) {
        	if (err == null) {
        		db.collection('stores').insert(newStore, function(err, result){
        			if (err === null) {
        				console.log('new store discount doc added');
        		}
        		res.send(
            		(err === null) ? { msg: '' } : { msg: err }
        			);
    			});
        	}
    	});
    	}
    });
});

router.post('/deletediscount', function(req, res) {
    console.log('/deletediscount');
    var db = req.db;
    
    // Find CategoryId
    var _bId = req.body.bId;
    var _sId = req.body.sId;
    var _sDiscount = 0;
    
    console.log('_bId:'+_bId);
    console.log('_sId:'+_sId);
  	console.log('_sDiscount:'+_sDiscount);
  	
  	
	db.collection('stores').findOne({bId:_bId.toString(),sId:_sId.toString()},function (err,doc) {
    if (doc){
    	var newStore = {
        		'bId': doc.bId,
        		'sId':doc.sId,
        		'sName':doc.sName,
        		'bName':doc.bName,
        		'bCategory':doc.cName,
        		'bDistributor':doc.bDistributor,
        		'sCity':doc.sCity,
        		'sAddress':doc.sAddress,
        		'sHours':doc.sHours,
        		'sAreaCode':doc.sAreaCode,
        		'sTel1':doc.sTel1,
        		'sTel2':doc.sTel2,
        		'sLat':doc.sLat,
        		'sLong':doc.sLong,
        		'sDiscount':Number(_sDiscount),
        		'sVerified':doc.sVerified
    	}
    	db.collection('stores').remove({bId:_bId,sId:_sId}, function(err, result) {
        	if (err == null) {
        		db.collection('stores').insert(newStore, function(err, result){
        			if (err === null) {
        				console.log('new store discount doc added');
        		}
        		res.send(
            		(err === null) ? { msg: '' } : { msg: err }
        			);
    			});
        	}
    	});
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
