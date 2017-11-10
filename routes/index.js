var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET history page. */
router.get('/history', function(req, res, next) {
  res.render('history');
});

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
