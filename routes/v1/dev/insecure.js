var express = require('express');
var router = express.Router();
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');
var fs = require('fs');


router.post('/brands/verification/sandbox', function(req, res) {
    console.log('dev insecure/verification/add/sandbox called');
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
      
      var tags = ""; 
      if (files['tags']) {
      	tags = files.tags; 
      }
               
      var record = {bId:fields.bId, title:fields.title, tags:fields.tags, shortDesc:fields.shortDesc, longDesc:longDesc, smallImage:smallImage, largeImage:largeImage};
      console.log('Verification Record'+record);
      
      db.collection('new_brand_verification').insert(record, function(err, result){
    		console.log('err'+err);
    		console.log('result'+result);
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


module.exports = router;
