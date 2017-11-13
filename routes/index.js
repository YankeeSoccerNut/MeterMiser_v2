var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var config = require('../config');

var bcrypt = require('bcrypt-nodejs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

/* GET history page. */
router.get('/history', function(req, res, next) {
  res.render('history');
});

router.get('/performance', function(req, res, next) {
  res.render('stackable');
});

router.get('/sign-up', function(req, res, next) {
  res.render('sign-up');
});

router.get('/usersProfile', function(req, res, next) {
  res.render('usersProfile');
});

router.get('/locations', function(req, res, next) {
  res.render('locations');
});

router.post('/loginProcess',(req,res,next)=>{
  // Check to see if email/pass exists in database

	console.log('im in INDEX')
  res.send("Need to implement the authentication for entered email/pass");
})

// router.get('/', function(req, res, next) {
// 	if(req.session.name === undefined){
// 		res.redirect('/login?msg=mustlogin');
// 		// stop the callback in it's tracks
// 		return;
// 	}
// });


module.exports = router;
