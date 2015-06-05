var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/brandlist', function(req, res) {
    res.setHeader('Content-Type', 'text/json; charset=utf-8')
    var db = req.db;
    var items = [];
    db.collection('brands').find().toArray(function (err, brands) {   
        brands.forEach(function(brand) {
    		db.collection('categories').find({cId:brand.bCategoryId}).toArray(function (e,categories) {
    		    categories.forEach(function(cat) {
    		    	var result = {bName:brand.bName, cName:cat.cName, bLogo:brand.bLogo};
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
    db.collection('brandlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deletebrand/:id', function(req, res) {
    var db = req.db;
    var userToDelete = req.params.id;
    db.collection('brandlist').removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
