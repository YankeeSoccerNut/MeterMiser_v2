var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req,res,next)=>{
	res.render('users',{});
});

router.get('/usersProfile', (req,res,next)=>{
	res.render('usersProfile',{});
});


router.post('/loginProcess',(req,res,next)=>{
	console.log('im here now. this is still magic to me. still in shock')
	console.log(req.body)
})


module.exports = router;
