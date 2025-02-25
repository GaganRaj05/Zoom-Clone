const jsonwebtoken = require('jsonwebtoken');

async function authorise(req, res,next) {
    try{
        const jwt = req.cookies.jwt;
        if(!jwt) {
            return res.status(400).json("Login to use this feature");
        }
        const isMatch = jsonwebtoken.verify(jwt,process.env.JWT_SECRET);
        if(!isMatch) {
            return res.status(400).json("Do not tamper with json token");
        }
        next();
    }
    catch(err) {
        console.log(err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json("Invalid token");
        } else if (err.name === 'TokenExpiredError') {
            return res.status(401).json("Token expired");
        } else {
            return res.status(500).json("Internal server error");
        }

    }
}
module.exports = authorise;