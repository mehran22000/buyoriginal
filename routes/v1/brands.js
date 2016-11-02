var express = require('express');
var router = express.Router();
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');
var fs = require('fs');
var masterPassword = 'AslNakhar';


/*
 * GET userlist.
 */
router.get('/brandlist/:env?', function(req, res) {
    res.setHeader('Content-Type', 'text/json; charset=utf-8')
    res.set({'Access-Control-Allow-Origin': '*'});
    var db = req.db;
    var items = [];
    var env = req.params.env;
    var col = 'brands';
	if (env === 'sandbox'){
		col = 'new_brands';    	
    }
    db.collection(col).find().toArray(function (err, brands) {   
        if (brands.length > 0) {
        	var counter = 0;
        	brands.forEach(function(brand) {
    			db.collection('categories').find({cId:brand.bCategoryId}).toArray(function (e,categories) {
    		    	counter = counter + 1;
    		    	categories.forEach(function(cat) {
    		    		var result = {_id:brand._id, bId:brand.bId, bName:brand.bName, cName:cat.cName, bLogo:brand.bLogo, cId:cat.cId};
    		    		items.push (result);
    				});
    				if (counter == brands.length){
    				    	var myJsonString = JSON.stringify(items);
    						res.json(items);
    				}
    			});
			});
		}
		else {
			res.json(items);
		}
    });
});


/*
* add brand - Dashboard
*/

router.post('/add/:env?', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    var env = req.params.env;
    var pwd = req.body.masterPassword;
    var col = 'brands';
	if (env === 'sandbox'){
		col = 'new_brands';    	
    }
	else {
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
		}
	}
    db.collection(col).insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
* Verification
*/

router.get('/verifications/:env?', function(req, res) {
    console.log('/v1/verifications called');
    var db = req.db;
    var env = req.params.env;
    var col = 'brand_verification';
	if (env === 'sandbox'){
		col = 'new_brand_verification';    	
    }
    
    db.collection(col).find().toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        console.log(items);
        res.json(items);
    }); 
});



router.get('/verification/:bId', function(req, res) {
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


router.post('/verification/prod', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    var pwd = req.body.masterPassword;
    if (pwd !== masterPassword) {
		res.send({ msg: 'Invalid Password' });
		return false;
	}
	
    db.collection('brand_verification').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.post('/verification/sandbox', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    db.collection('new_brand_verification').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.post('/addverification', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    
    var form = new formidable.IncomingForm();
    form.uploadDir = './public/images/verifications';

    form.parse(req, function(err, fields, files) {
    
      var longDesc = "";
      if (fields.longDesc) {
      	 longDesc = fields.longDesc;
      }
      
      var tags = "";
      if (fields.tags) {
      	 tags = fields.tags;
      }	
       
      var smallImage = ""; 
      if (files['smallImage']) {
      	smallImage = files['smallImage'].name; 
      } 
        
      var largeImage = ""; 
      if (files['largeImage']) {
      	largeImage = files['largeImage'].name; 
      }
               
      var record = {bId:fields.bId, title:fields.title, tags:fields.tags, shortDesc:fields.shortDesc, longDesc:longDesc, smallImage:smallImage, largeImage:largeImage};
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
router.delete('/deletebrand/:id/:env?/:pwd?', function(req, res) {
    console.log('/deletebrand/:id/:env?');
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
	var env = req.params.env;
    var pwd = req.params.pwd;
    var col = 'brands';
	if (env === 'sandbox'){
		col = 'new_brands';    	
    }
    else {
		console.log(pwd);
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
		}
	}
    var userToDelete = req.params.id;
    db.collection(col).removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

router.delete('/verification/delete/:id/:env?/:pwd?', function(req, res) {
    console.log('deleteVerification');
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    var verificationToDelete = req.params.id;
    var env = req.params.env;
    var pwd = req.params.pwd;
    var col = 'brand_verification';
	if (env === 'sandbox'){
		col = 'new_brand_verification';    	
    }
    else {
		console.log(pwd);
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
			return false;
		}
	}
    
    db.collection(col).removeById(verificationToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});



module.exports = router;
