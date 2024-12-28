const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Get user profile
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');
        const posts = await Post.find({ userId: req.params.id });
        
        res.json({
            user,
            posts,
            postsCount: posts.length
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Follow/Unfollow user
router.put('/:id/follow', auth, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: "You can't follow yourself" });
        }
        
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);
        
        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isFollowing = currentUser.following.includes(req.params.id);
        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
            userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user.id);
        } else {
            // Follow
            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.user.id);
        }
        
        await currentUser.save();
        await userToFollow.save();
        
        res.json({ message: isFollowing ? 'Unfollowed' : 'Followed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Search users by username (with substring support)
router.get('/search', auth, async (req, res) => {
    try {
        const { query, page = 1, limit = 10 } = req.query;
        
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        })
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit);
        
        const total = await User.countDocuments({
            username: { $regex: query, $options: 'i' }
        });
        
        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 