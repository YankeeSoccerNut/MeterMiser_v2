var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../config');

var bcrypt = require('bcrypt-nodejs');


var connection = mysql.createConnection(config.db);
connection.connect((error)=>{
	if (error){
		throw error;
	}
})

/* GET users listing. */
router.get('/', (req,res,next)=>{
	res.render('users',{});
});

router.get('/usersProfile', (req,res,next)=>{
	res.render('usersProfile',{});
});

router.get('/sign-up',(req,res,next)=>{
	res.render('sign-up',{email:req.session.email});
})

router.post('/sign-up-process',(req,res,next)=>{
// You should only be able to get to the usersProfile page if we have you
// in the mySQL database
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var password = req.body.password;
	var phone = req.body.phone;
	var sms = req.body.sms;

	var selectQuery = `SELECT * FROM Users WHERE email = ?;`;
	connection.query(selectQuery, [email], (error,results)=>{
		console.log(results);
		if(results.length != 0){

			console.log('user already exists');
			// res.send('This user already exist.')
			res.redirect('/users', {msg: 'User already exists.'})
		}else{
			console.log('user doesnt exist');

			var hash = bcrypt.hashSync(password);
			console.log(hash);
			// console.log(hash.length);
			var insertQuery = `INSERT INTO Users (email, password, fname, lname, phone, smsphone) VALUES (?,?,?,?,?,?);`;
			connection.query(insertQuery, [email, hash, firstName, lastName, phone, sms],(error)=>{
				if(error){
					throw error;
				}else{
					console.log('User signed up successfully!');
					req.session.email = email
					res.redirect('/users/usersProfile')
				}
			})
		}
	})
})//router.post('/sign-up-process'

router.post('/validateProcess',(req,res,next)=>{
	res.send('posted validateProcess')
})//router.post('/validateProcess'









module.exports = router;
