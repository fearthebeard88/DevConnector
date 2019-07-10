const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.js");
const {check, validationResult} = require("express-validator/check");
const User = require("../../models/User.js");
const Profile = require("../../models/Profile.js");
const Post = require("../../models/Post");

/**
 * @route POST api/posts
 * @desc Create a post
 * @access Private
 */
router.post(
    "/",
    [
        auth,
        [
            check("text", "Text is required.")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        try {
            const user = await User.findOne({_id: req.user.id}).select(
                "-password"
            );
            if (!user) {
                return res.status(400).json({msg: "User not found."});
            }

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });

            await newPost.save();
            return res.status(200).json(newPost);
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
);

/**
 * @route GET api/posts
 * @description Get all posts
 * @access Private
 */
router.get("/", auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1});
        return res.status(200).json(posts);
    } catch (err) {
        console.error(err);
        return res.status(500).json(err);
    }
});

/**
 * @route GET api/posts
 * @description Get post by id
 * @access Private
 */
router.get("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findOne({_id: req.params.id});
        if (!post) {
            return res.status(404).json({msg: "No post found by that ID."});
        }

        return res.status(200).json(post);
    } catch (err) {
        if (err.kind === "ObjectId") {
            console.error(err);
            return res
                .status(400)
                .json({msg: "Post id provided is not valid."});
        }
        console.error(err);
        return res.status(500).json(err);
    }
});

/**
 * @route DELETE api/posts
 * @description Delete post by id
 * @access Private
 */
router.delete("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({msg: "No post by that ID was found."});
        }

        if (post.user.toString() !== req.user.id) {
            return res
                .status(401)
                .json({msg: "User is not autherized to delete this post."});
        }

        await post.remove();
        return res.status(200).json({msg: "Post has been deleted."});
    } catch (err) {
        if (err.kind === "ObjectId") {
            console.error(err);
            return res
                .status(400)
                .json({msg: "Post id provided is not valid."});
        }

        console.error(err);
        return res.status(500).json(err);
    }
});

/**
 * @route PUT api/posts/like/:id
 * @description Like a post
 * @access Private
 */
router.put("/like/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({msg: "No post found."});
        }

        let likeIndex = [];
        for (let i = 0; (count = post.likes.length), i < count; i++) {
            if (post.likes[i].user.toString() === req.user.id) {
                likeIndex.push(i);
            }

            continue;
        }

        if (likeIndex.length > 0) {
            // This post is liked already, remove the like
            // There should never be more than one like in the array, but on the off chance there is more than one, we can loop through the array to remove them all
            for (let i = likeIndex.length - 1; i >= 0; i--) {
                post.likes.splice(likeIndex[i], 1);
            }

            await post.save();
            return res
                .status(200)
                .json({msg: "Like has been removed from post."});
        }

        // Post is not liked yet, add a like
        post.likes.unshift({user: req.user.id});
        await post.save();
        return res.status(200).json(post.likes);
    } catch (err) {
        console.error(err);
        return res.status(500).json(err);
    }
});

/**
 * @route POST api/posts/comment/:id
 * @description Add comment to post
 * @access Private
 */
router.post(
    "/comment/:id",
    [
        auth,
        check("text", "Text field cannot be empty.")
            .not()
            .isEmpty()
    ],
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({msg: "No Post found by that ID."});
            }

            if (!user) {
                return res.status(404).json({msg: "User not found."});
            }

            const newComment = {
                name: user.name,
                text: req.body.text,
                user: user.id,
                avatar: user.avatar
            };

            post.comments.unshift(newComment);
            await post.save();
            return res.status(200).json(post.comments);
        } catch (err) {
            console.error(err);
            return res.status(500).json(err);
        }
    }
);

/**
 * @route DELETE api/posts/comment/:post_id/:comment_id
 * @description Delete a comment from a post
 * @access Private
 */
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({msg: "Post not found."});
        }

        const comment = post.comments.find(comment => {
            return comment.id === req.params.comment_id;
        });

        if (!comment) {
            return res.status(404).json({msg: "Comment not found."});
        }

        if (comment.user.toString() !== req.user.id) {
            return res
                .status(401)
                .json({msg: "You are not authorized to delete this comment."});
        }

        const index = post.comments.map((comment, i) => {
            if (comment.user.toString() === req.params.comment_id) {
                return i;
            }
        });

        post.comments.splice(index, 1);
        await post.save();
        return res.status(200).json(post.comments);
    } catch (err) {
        console.error(err);
        return res.status(500).json(err);
    }
});

module.exports = router;
