const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.js");
const User = require("../../models/User.js");
const jwt = require("jsonwebtoken");
const config = require("config");
const {check, validationResult} = require("express-validator/check");
const bcrypt = require("bcryptjs");

// @route GET api/auth
// @desc Returns a user object without password
// @access Private
// adding function as second param to router.get adds middleware to individual route
router.get("/", auth, async (req, res) => {
    try {
        // we set the user id in auth middleware
        // .select is like addAttributeToSelect in magento, we are adding a piece to the select query and telling it to remove the password from the returned row
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error.");
    }
});

// @route POST api/auth
// @desc Authenticate user & get token
// @access Public
router.post(
    "/",
    [
        check("email", "Please provide a valid email.").isEmail(),
        check("password", "Password is required.").exists()
    ],
    async (req, res) => {
        // these are the results of the validation methods returned by the call back check methods
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const {email, password} = req.body;
        try {
            // {email} is equivilent to {email: email}
            let user = await User.findOne({email});
            if (!user) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: "Invalid credentials."
                        }
                    ]
                });
            }

            const isMatch = bcrypt.compareSync(password, user.password);

            if (!isMatch) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: "Invalid credentials."
                        }
                    ]
                });
            }

            const payload = {
                user: {
                    id: user.id
                }
            };

            const secret = config.get("jwtSecret");
            jwt.sign(
                payload,
                secret,
                {
                    expiresIn: 360000
                },
                (err, token) => {
                    if (err) {
                        throw err;
                    }

                    res.json({token});
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error.");
        }
    }
);

module.exports = router;
