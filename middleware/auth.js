const jwt = require("jsonwebtoken");
const config = require("config");

// exporting a middleware function to validate token
module.exports = function(req, res, next) {
    // get token from header under param x-auth-token
    const token = req.header("x-auth-token");

    // if no token is detected we send the user to a 401 page
    if (!token) {
        return res.status(401).json({
            msg: "No token recieved, authorization is denied."
        });
    }

    // verify token
    try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));

        // decoded.user becomes the users _id from mongo
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({
            msg: "Token is invalid."
        });
    }
};
