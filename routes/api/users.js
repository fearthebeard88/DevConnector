const express = require("express");
const router = express.Router();
const {check, validationResult} = require("express-validator/check");
const User = require("../../models/User.js");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

// @route POST api/users
// @desc Register user
// @access Public
router.post(
    "/",
    [
        // checks for POST param of name, and returns a message if it fails the validation rules indicated by methods chained after
        check("name", "Name is required.")
            .not()
            .isEmpty(),
        check("email", "Please provide a valid email.").isEmail(),
        check(
            "password",
            "Please enter a password with 6 or more characters."
        ).isLength({min: 6})
    ],
    async (req, res) => {
        // these are the results of the validation methods returned by the call back check methods
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        // destructuring req.body object into individual params
        const {name, email, password} = req.body;

        try {
            // {email} is equivilent to {email: email}
            let user = await User.findOne({email});
            if (user) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: "User already exists."
                        }
                    ]
                });
            }

            // s = size, r = maturity rating, d = default
            const avatar = gravatar.url(email, {
                s: "200",
                r: "pg",
                d: "mm"
            });

            user = new User({
                name,
                email,
                avatar,
                password
            });

            // arg is how many rounds, more rounds = more secure
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            // Payload is how the server knows who the user is, because the payload includes a user id from mongoDB
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
