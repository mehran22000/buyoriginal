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
