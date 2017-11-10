var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req,res,next)=>{
	res.render('users',{});
});

router.get('/usersProfile', (req,res,next)=>{
	res.render('usersProfile',{});
});

router.get('/sign-up',(req,res,next)=>{
	res.render('sign-up')
})

router.post('/loginProcess',(req,res,next)=>{
// You should only be able to get to the usersProfile page if we have you 
// in the mySQL database
	var name = req.body.name
	var email = req.body.email;
	var password = req.body.password
	var selectQuery = `SELECT * FROM Users WHERE (email, password) = (?,?);`;
	console.log('im here now. this is still magic to me. still in shock')
	console.log(req.body)
	res.redirect('/usersProfile');
})






module.exports = router;
