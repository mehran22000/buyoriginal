var express = require('express');
var router = express.Router();
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');
var fs = require('fs');

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


/*
* Verification
*/

router.get('/v1/verifications', function(req, res) {
    console.log('/v1/verifications called');
    var db = req.db;
    db.collection('brand_verification').find().toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        console.log(items);
        res.json(items);
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

router.post('/v1/addverification', function(req, res) {
    console.log('/v1/addverification/ called');
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    
    var form = new formidable.IncomingForm();
    form.uploadDir = './public/images/verifications';

    form.parse(req, function(err, fields, files) {
    
     var longDesc = "";
      if (fields.longDesc) {
      	 longDesc = fields.longDesc;
      }	
       
      var smallImage = ""; 
      if (files['smallImage']) {
      	smallImage = files['smallImage'].name; 
      } 
        
      var largeImage = ""; 
      if (files['largeImage']) {
      	largeImage = files['largeImage'].name; 
      }
               
      var record = {bId:fields.bId, title:fields.title, shortDesc:fields.shortDesc, longDesc:longDesc, smallImage:smallImage, largeImage:largeImage};
      console.log('Verification Record'+record);
      
      db.collection('brand_verification').insert(record, function(err, result){
    	});
    }); 
      
    
    form.on('file', function(field, file) {
    	console.log("file upload");
    	if (file.path) {
    		fs.rename(file.path, form.uploadDir + "/" + file.name);
    	}
    });

    form.on('error', function(err) {
        console.log("an error has occured with form upload");
        console.log(err);
        request.resume();
    });

    form.on('aborted', function(err) {
        console.log("user aborted upload");
    });

    form.on('end', function() {
        console.log('-> upload done');
        var fullUrl = req.protocol + '://' + req.get('host')+'/dashboard_original_fake.html';
        res.writeHead(301,{Location: fullUrl});
		res.end();
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

router.delete('/v1/deleteVerification/:id', function(req, res) {
    console.log('deleteVerification');
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    var verificationToDelete = req.params.id;
    db.collection('brand_verification').removeById(verificationToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});



module.exports = router;
