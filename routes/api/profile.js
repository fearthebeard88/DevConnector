const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.js");
const Profile = require("../../models/Profile.js");
const User = require("../../models/User.js");
const {check, validationResult} = require("express-validator/check");

/**
 * @route GET api/profile/me
 * @description Get current users profile
 * @access Private
 */
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate(
            "user",
            ["name", "avatar"]
        );
        if (!profile) {
            return res
                .status(400)
                .send({msg: "There is no profile for this user."});
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error Occured.");
    }
});

/**
 * @route POST api/profile
 * @description Create or update user profile
 * @access Private
 */
router.post(
    "/",
    [
        auth,
        [
            check("status", "Status is required.")
                .not()
                .isEmpty(),
            check("skills", "Skills is required.")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const params = [
            "company",
            "website",
            "location",
            "bio",
            "status",
            "githubusername"
        ];

        const socialParams = [
            "youtube",
            "twitter",
            "facebook",
            "linkedin",
            "instagram"
        ];

        // Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        params.forEach(param => {
            if (
                typeof req.body[param] == "undefined" ||
                req.body[param].trim().length == 0
            ) {
                return;
            }

            profileFields[param] = req.body[param].trim();
        });

        // Build profile skills parameter
        profileFields.skills =
            typeof req.body.skills == "undefined"
                ? []
                : req.body.skills.split(",").map(skill => {
                      return skill.trim();
                  });

        // Build profile social parameter
        profileFields.social = {};
        socialParams.forEach(param => {
            if (
                typeof req.body[param] == "undefined" ||
                req.body[param].trim().length == 0
            ) {
                return;
            }

            profileFields.social[param] = req.body[param].trim();
        });

        try {
            let profile = await Profile.findOne({user: req.user.id});
            if (profile) {
                profile = await Profile.findOneAndUpdate(
                    {user: req.user.id},
                    {$set: profileFields},
                    {new: true}
                );

                console.log("Profile Updated.");
                return res.status(200).json(profile);
            }

            profile = new Profile(profileFields);
            await profile.save();
            console.log("Profile created.");
            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({error: err.message});
        }
    }
);

/**
 * @route GET api/profile
 * @description Get all public profiles
 * @access Public
 */
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar"
        ]);
        return res.status(200).json(profiles);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({error: err});
    }
});

/**
 * @route GET api/profile/user/:user_id
 * @description Get profile by user id
 * @access Public
 */
router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate("user", ["name", "avatar"]);
        if (!profile) {
            return res.status(400).json({msg: "No profile found."});
        }

        return res.status(200).json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == "ObjectId") {
            return res.status(400).json({msg: "No profile found."});
        }

        return res.status(500).json({error: err});
    }
});

/**
 * @route DELETE api/profile
 * @description Delete profile, user, and posts of logged in user
 * @access Private
 * @todo remove users posts
 */
router.delete("/", auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({user: req.user.id});
        await User.findOneAndRemove({_id: req.user.id});
        return res.status(200).json({msg: "Deletion successful."});
    } catch (err) {
        console.error(err);
        return res.status(500).json({msg: "Deletion failed."});
    }
});

/**
 * @route PUT api/profile/experience
 * @description Add profile experience
 * @access Private
 */
router.put(
    "/experience",
    [
        auth,
        [
            check("title", "Title is required.")
                .not()
                .isEmpty(),
            check("company", "Company is required.")
                .not()
                .isEmpty(),
            check("from", "From date is required.")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({user: req.user.id});

            if (!profile) {
                return res.status(400).json({msg: "No profile found."});
            }

            profile.experience.unshift(newExp);
            await profile.save();
            return res.status(200).json(profile);
        } catch (err) {
            console.error(err);
            return res.status(500).json({error: err});
        }
    }
);

module.exports = router;
