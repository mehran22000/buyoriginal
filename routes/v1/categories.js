var express = require('express');
var router = express.Router();
var masterPassword = 'AslNakhar';


/*
 * GET categorylist.
 */
router.get('/categorylist/:env?', function(req, res) {
    var db = req.db;
    var env = req.params.env;
    var col = 'categories';
	if (env === 'sandbox'){
		col = 'new_categories';    	
    }
    db.collection(col).find().toArray(function (err, items) {
    		res.set({'Access-Control-Allow-Origin': '*'});
        	res.json(items);
    });
});

/*
 * POST to add category.
 */
router.post('/add/:env?', function(req, res) {
    var db = req.db;
    var env = req.params.env;
    var pwd = req.body.masterPassword;
    var col = 'categories';
	if (env === 'sandbox'){
		col = 'new_categories';    	
    }
	else {
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
			return;
		}
	}
    db.collection(col).insert(req.body, function(err, result){
        console.log('category ' + req.body.cName + ' promoted'); 
        res.set({'Access-Control-Allow-Origin': '*'});
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/delete/:id/:env?/:pwd?', function(req, res) {
    console.log('/delete/:id/:env?/:pwd?');
    var db = req.db;
    var env = req.params.env;
    var pwd = req.params.pwd;
    var col = 'categories';
	if (env === 'sandbox'){
		col = 'new_categories';    	
    }
    else {
		console.log(pwd);
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
			return;
		}
	}
    var catToDelete = req.params.id;
    db.collection(col).removeById(catToDelete, function(err, result) {
        console.log('category ' + catToDelete + ' deleted from ' + env);
        res.set({'Access-Control-Allow-Origin': '*'});
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
