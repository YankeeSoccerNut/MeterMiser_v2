var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var config = require('../config');

var bcrypt = require('bcrypt-nodejs');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

<<<<<<< Updated upstream
/* GET history page. */
router.get('/history', function(req, res, next) {
  res.render('history');
});

<<<<<<< Updated upstream
router.get('/performance', function(req, res, next) {
  res.render('stackable');
});

=======
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
router.post('/loginProcess',(req,res,next)=>{
	console.log('im in INDEX')
})

// router.get('/', function(req, res, next) {
// 	if(req.session.name === undefined){
// 		res.redirect('/login?msg=mustlogin');
// 		// stop the callback in it's tracks
// 		return;
// 	}
// });


module.exports = router;
