var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var config = require('../config/config');

var bcrypt = require('bcrypt-nodejs');

var connection = mysql.createConnection(config.db);
connection.connect((error)=>{
	if (error){
		throw error;
	}
})


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

router.get('/activitylog', function(req,res,next) {
	res.render('activitylog');
})

router.get('/sign-up', function(req, res, next) {
  res.render('sign-up');
});

router.get('/usersProfile', function(req, res, next) {
  res.render('usersProfile');
});

router.get('/account-main', function(req, res, next) {
  res.render('user-account');
});

router.get('/locations', function(req, res, next) {
  res.render('locations');
});

router.post('/loginProcess',(req,res,next)=>{
  // Check to see if email/pass exists in database
  console.log(req.body);
  var email = req.body.email;
  var password = req.body.password; // English version from user
  // write a query to check if the user is the DB
  var selectQuery = `SELECT * FROM users WHERE email = ?;`;
  connection.query(selectQuery,[email],(err,results)=>{
      if(err){
          console.log(err);
      }else{
          if(results.length == 0){
              // this user isn't in the databse. We dont care what pass they gave us.
              res.redirect('/?msg=notValidEmail');
              // show not valid input modal
          }else{
              // our select query found something! Check the pass...
              // call compareSync
              var passwordsMatch = bcrypt.compareSync(password,results[0].password)
              if(passwordsMatch){
                  var row = results[0];
                  // user in db, password is legit. Log them in.
                  req.session.uid = row.id;
                  req.session.email = row.email;
                  req.session.loggedIn = true;
                  console.log(req.session.uid)
                  res.redirect('/locations');
              }else{
                  // user in db, but password is bad. Send them back to login
                  res.redirect('/login?msg=badPass');
                  // show not valid input modal
              }
          }
      }
  });


  // res.send("Need to implement the authentication for entered email/pass");
})

// router.get('/', function(req, res, next) {
// 	if(req.session.name === undefined){
// 		res.redirect('/login?msg=mustlogin');
// 		// stop the callback in it's tracks
// 		return;
// 	}
// });


module.exports = router;
