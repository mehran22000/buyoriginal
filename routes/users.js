var express = require('express');
var router = express.Router();

/*
 * Business Users
 */
 router.get('/business/userlist', function(req, res) {
    var db = req.db;
    db.collection('business_users').find().toArray(function (err, items) {
        res.json(items);
    });
});

router.get('/business/forgetpassword/:email', function(req, res) {
    
    console.log('/business/forgetPassword');
    var postmark = require("postmark");
	var db = req.db;
	var email = req.params.email;
	console.log('email:'+email.toString());
	
	// Retrieve Password
	var password = null;
    	
    db.collection('business_users').findOne({buEmail:email.toString()},function (err,doc) {

	    if (err != null) {
    		console.log('Error: user not found');
    		res.send(JSON.stringify({ "err": "invalid_email"}));
        	return;
        }
        else if (doc != null) {
        	password = doc.buPassword;
        	console.log('Password='+password);
        
        	if (password != null) {
    	
    			var client = new postmark.Client("0aba8682-68fb-4720-abbc-ae22d778b02b");
    			var eHeader = " سلام " + doc.buStoreName.toString() +"\n";
				var eBody1="رمز عبور شما برای مدیریت فروشگاه شما در موبایل اپلیکیشن و وبسایت اصل بخر مطابق زیر است:"+"\n";
				var eBody2="شناسه:"+ doc.buEmail.toString()+"\n";
				var eBody3="رمز عبور:"+ doc.buPassword.toString()+"\n";
				var eFooter = "برای اطلاعات بیشتر یا هرگونه سوال و پیشنهاد لطفا با پست الکترونیکی  support@aslbekhar.com تماس بگیرید."+"\n"+"با تشکر"+"\n"+"مدیریت اصل بخر ";
    		
    			client.sendEmail({
    				"From": "passwordrecovery@aslbekhar.com",
    				"To": email.toString(),
    				"Subject": "Aslbekhar.com Password Recovery", 
    				"TextBody": eHeader+"\n"+eBody1+"\n"+eBody2+"\n"+eBody3+"\n"+eFooter,
				} , function(error, success) {
    				if(error) {
        				console.error("Unable to send via postmark: " + error.message);
        				console.log("Unable to send via postmark: " + error.message);
        				res.send(JSON.stringify({ "err": error.message}));
        				return;
    				}
    				else {
    					console.log("Password was sent!");
    					res.send(JSON.stringify({ "result": "success"}));
            			return;
            		}
    			});  
        	}        	
        	else {
        		console.log("Password not found!");
        		res.send(JSON.stringify({ "err": "password_notfound"}));
        		return;
        	}
        }
    else {
    	console.log("User not found!");
    	res.send(JSON.stringify({ "err": "invalid_email"}));
   		return;
    	}
    });
    	
});


router.get('/business/validateemail/:email', function(req, res) {
    var db = req.db;
    var email = req.params.email;
    db.collection('business_users').find({buEmail:email.toString()}).toArray(function (err, items) {
        if (items.length==0){
        	res.send(JSON.stringify({ "duplicate": "false"}));
        }
        else {
        	res.send(JSON.stringify({ "duplicate": "true"}));
        }
    });
});


router.post('/business/login', function(req, res) {
    var db = req.db;
    var email = req.body.email;
    var password = req.body.password;
    
    //res.send('succesful');
    
    db.collection('business_users').find({buEmail:email.toString()}).toArray(function (err, doc) {
        if (doc.length==0){
        	var array = [{ "err": "err_invalid_email"}];
            res.json(array);       
        }
        else {
            console.log('doc.buPassword='+doc[0].buPassword+' password='+password);
        	if (doc[0].buPassword==password){	   
        		console.log('doc.buStoreId='+doc[0].buStoreId);
            	db.collection('stores').findOne({sId:doc[0].buStoreId}, function (sErr, sDoc) {
            		if (sErr!=null){
            			var array = [{ "err": "err_store_unavailable"}];
    					res.json(array);
            		}
            		else {
            		    console.log('dNote='+sDoc.dNote);
            		    var profile = [{
        							  'buId': doc[0].buId,
        							  'buEmail':doc[0].buEmail,
        							  'buPassword':doc[0].buPassword,
        							  'buCityName':doc[0].buCityName,
        							  'buCityNameFa':doc[0].buCityNameFa,
        						      'buBrandId':doc[0].buBrandId,
        							  'buBrandName':doc[0].buBrandName,
        							  'buBrandCategory':doc[0].buBrandCategory,
        							  'buStoreName':doc[0].buStoreName,
        							  'buStoreAddress':doc[0].buStoreAddress,
        							  'buStoreHours':doc[0].buStoreHours,
        							  'buDistributor':doc[0].buDistributor,
        							  'buStoreLat':doc[0].buStoreLat,
        							  'buStoreLon':doc[0].buStoreLon,
        							  'buAreaCode':doc[0].buAreaCode,
        							  'buTel':doc[0].buTel,
        							  'buStoreId':doc[0].sId,
        							  'buBrandLogoName':doc[0].buBrandLogoName,
        							  'dStartDate': sDoc.dStartDate,
        							  'dEndDate': sDoc.dEndDate,
        							  'dStartDateFa': sDoc.dStartDateFa,
        							  'dEndDateFa': sDoc.dEndDateFa,
        							  'dPrecentage': sDoc.dPrecentage,
        							  'dNote': sDoc.dNote
        							  }];
            		
            			res.json(profile);	
            		}
            	});
            }       
        	else {
        		var array = [{ "err": "err_invalid_password"}];
    			res.json(array);       
        	}
    	}
    });
});


router.post('/business/deleteuser/:email', function(req, res) {
    console.log('/business/deleteuser');
	var error=null;
    var email = req.params.email;
   
	db.collection('business_users').remove({buEmail:email.toString()}, function(err, result) {
    	if (err == null) {
    		console.log('User account deleted');
    		var array = [{ "result": "success"}];
        	res.json(array);
        }
        else {
        	var array = [{ "err": "failed"}];
    		res.json(array);
        }
    });
});
    		
router.post('/business/updateuser', function(req, res) {
    console.log('/business/updateuser');
	var error=null;
    
	db.collection('business_users').remove({buId:req.body.buId}, function(err, result) {
        	if (err == null) {
        		console.log('old user info deleted');
        		var newUser = {
        			'buId': req.body.buId,
        			'buEmail':req.body.buEmail,
        			'buPassword':req.body.buPassword,
        			'buCityName':req.body.buCityName,
        			'buCityNameFa':req.body.buCityNameFa,
        			'buBrandId':req.body.buBrandId,
        			'buBrandName':req.body.buBrandName,
        			'buBrandCategory':req.body.buBrandCategory,
        			'buStoreName':req.body.buStoreName,
        			'buStoreAddress':req.body.buStoreAddress,
        			'buStoreHours':req.body.buStoreHours,
        			'buDistributor':req.body.buDistributor,
        			'buStoreLat':req.body.buStoreLat,
        			'buStoreLon':req.body.buStoreLon,
        			'buAreaCode':req.body.buAreaCode,
        			'buTel':req.body.buTel,
        			'buStoreId':req.body.buStoreId,
        			'buBrandLogoName':req.body.buBrandLogoName
    			}
    			
    			db.collection('business_users').insert(newUser, function(err, result){
        		if (err === null) {
        			console.log('updated user info added');
        		}
        		else {
        			error = err;
        		}	
        	});
    	}
    	else {
    		error = err;
    	}});
    	
    	if (error != null){
    		var array = [{ "result": "failed"}];
    		res.json(array);
    	}
    	else {
    		var array = [{ "result": "success"}];
        	res.json(array); 
        }
    });

 
router.post('/business/adduser', function(req, res) {
    console.log('/business/adduser');
    var db = req.db;
    var buId = 0;
    var sId = 0;
    var error=null;
    
    // 1) Find Stats
    db.collection('stats').findOne({},function (err,doc) {
        
        if (err!=null)
        	error = err;
        	 
        if (doc){
            sId=(parseInt(doc.numStores)+1).toString();
            buId=(parseInt(doc.numBusinessUsers)+1).toString();
            
        	console.log('add user: sId'+sId + ' business user id'+buId);
        	
        	// 2) Add new user	
        	var newUser = {
        		'buId': buId,
        		'buEmail':req.body.buEmail,
        		'buPassword':req.body.buPassword,
        		'buCityName':req.body.buCityName,
        		'buCityNameFa':req.body.buCityNameFa,
        		'buBrandId':req.body.buBrandId,
        		'buBrandName':req.body.buBrandName,
        		'buBrandCategory':req.body.buBrandCategory,
        		'buStoreName':req.body.buStoreName,
        		'buStoreAddress':req.body.buStoreAddress,
        		'buStoreHours':req.body.buStoreHours,
        		'buDistributor':req.body.buDistributor,
        		'buStoreLat':req.body.buStoreLat,
        		'buStoreLon':req.body.buStoreLon,
        		'buAreaCode':req.body.buAreaCode,
        		'buTel':req.body.buTel,
        		'buStoreId':sId,
        		'buBrandLogoName':req.body.buBrandLogoName
    		}
    
    		db.collection('business_users').insert(newUser, function(err, result){
        		if (err === null) {
        			console.log('new user doc added');
        		   
        		    // 3) Add store
        			var newStore = {
        				'bId': req.body.buBrandId,
        				'sId':sId,
        				'sName':req.body.buStoreName,
        				'bName':req.body.buBrandName,
        			    'bCategory':req.body.buBrandCategory,
        			    'bDistributor':req.body.buDistributor,
        			    'sCity':req.body.buCity,
        			    'sAddress':req.body.buStoreAddress,
        			    'sHours':req.body.buStoreHours,
        			    'sAreaCode':req.body.buAreaCode,
        			    'sTel1':req.body.buTel,
        			    'sTel2':'',
        			    'sLat':req.body.buStoreLat,
        			    'sLong':req.body.buStoreLon,
        			    'sVerified':'No',
        			    'bLogo':req.body.buBrandLogoName
    				}
        	
        			db.collection('stores').insert(newStore, function(err, result){
        			if (err === null) {
        				console.log('new store doc added');
        				
        				// 4) Update Stats
        				doc.numBusinessUsers=buId;
        				doc.numStores=sId;
        				db.collection('stats').update({},doc, function (err,result){
        					if (err === null) {
        						console.log('stats updated');
        					}
        					else {
        						error = err;
        					}
        				});
        			}
        			else {
        				error=err;
        			}
        		
    			});	
        	}
        	else {
        		error = err;
        	}
        });
      }
    });	
    
    if (error != null){
    	var array = [{ "result": "failed"}];
    	res.json(array);
    }
    else {
    	var array = [{ "result": "success"}];
        res.json(array); 
    }
});




/*
 * GET userlist.
 */
router.get('/userlist', function(req, res) {
    var db = req.db;
    db.collection('userlist').find().toArray(function (err, items) {
        res.json(items);
    });
});

/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
    var db = req.db;
    db.collection('userlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deleteuser/:id', function(req, res) {
    var db = req.db;
    var userToDelete = req.params.id;
    db.collection('userlist').removeById(userToDelete, function(err, result) {
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
