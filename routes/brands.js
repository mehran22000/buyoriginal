var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/brandlist', function(req, res) {
    res.setHeader('Content-Type', 'text/json; charset=utf-8')
    res.set({'Access-Control-Allow-Origin': '*'});
    var db = req.db;
    var items = [];
    
    db.collection('brands').find().toArray(function (err, brands) {   
        brands.forEach(function(brand) {
    		db.collection('categories').find({cId:brand.bCategoryId}).toArray(function (e,categories) {
    		    categories.forEach(function(cat) {
    		    	var result = {_id:brand._id, bId:brand.bId, bName:brand.bName, cName:cat.cName, bLogo:brand.bLogo};
    		    	console.log(result);
    				items.push (result);
    				console.log(result);
    				console.log(myJsonString);
    				console.log(items.length);
    				console.log(brands.length);
    				if (items.length == brands.length){
    				    var myJsonString = JSON.stringify(items);
    					res.json(items);
    				}
    			});
    		});
		});
    });
});





/*
 * POST to adduser.
 */
router.post('/addbrand', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
	
    db.collection('brands').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});


router.get('/v1/verification/:bId', function(req, res) {
    console.log('/v1/verification/ called');
    var db = req.db;
    var bId=String(req.params.bId)
    console.log(bId);
    db.collection('brand_verification').find({bId:bId}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        console.log(items);
        res.json(items);
    }); 
});




/*
 * DELETE to deleteuser.
 */
router.delete('/deletebrand/:id', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});

    var userToDelete = req.params.id;
    db.collection('brands').removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
