const router = require('express').Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Create post
router.post('/', auth, async (req, res) => {
    try {
        const newPost = new Post({
            ...req.body,
            userId: req.user.id
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user feed (paginated)
router.get('/feed', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const user = await User.findById(req.user.id);
        const posts = await Post.find({
            userId: { $in: [...user.following, req.user.id] }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'username profilePicture');
        
        res.json(posts);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Like/Unlike post
router.put('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        const likeIndex = post.likes.indexOf(req.user.id);
        if (likeIndex === -1) {
            post.likes.push(req.user.id);
        } else {
            post.likes.splice(likeIndex, 1);
        }
        
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const newComment = new Comment({
            userId: req.user.id,
            postId: req.params.id,
            content: req.body.content
        });
        
        const savedComment = await newComment.save();
        const post = await Post.findById(req.params.id);
        post.comments.push(savedComment._id);
        await post.save();
        
        res.status(201).json(savedComment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Search posts by hashtags with pagination
router.get('/search/hashtags', auth, async (req, res) => {
    try {
        const { hashtag, page = 1, limit = 10 } = req.query;
        
        const posts = await Post.find({
            caption: { $regex: `#${hashtag}`, $options: 'i' }
        })
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
        
        const total = await Post.countDocuments({
            caption: { $regex: `#${hashtag}`, $options: 'i' }
        });
        
        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get posts with filters
router.get('/filter', auth, async (req, res) => {
    try {
        const { 
            category,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;
        
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
            
        const total = await Post.countDocuments(query);
        
        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get paginated likes for a post
router.get('/:id/likes', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const post = await Post.findById(req.params.id);
        
        const users = await User.find({
            _id: { $in: post.likes }
        })
        .select('username profilePicture')
        .skip((page - 1) * limit)
        .limit(limit);
        
        const total = post.likes.length;
        
        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get paginated comments for a post
router.get('/:id/comments', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const comments = await Comment.find({ postId: req.params.id })
            .populate('userId', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
            
        const total = await Comment.countDocuments({ postId: req.params.id });
        
        res.json({
            comments,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 