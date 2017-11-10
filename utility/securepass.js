// From stackoverflow response on securing routes...
function secure_pass(req, res, next) {
    console.log ("in secure_pass...");
    req.session.loggedIn = true;
    console.log(req.session.loggedIn);
    if (req.session.loggedIn){
        next();
    } else {
       res.send("Unauthorized");
    };
};

module.exports = secure_pass;
