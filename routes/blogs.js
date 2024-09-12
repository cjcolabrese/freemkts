const express = require('express')
const passport = require('passport')
const router = express.Router()
const mongoose = require('mongoose')
const Blog = require('../models/Blog')

// @desc    Auth with Google
// @route   GET /auth/google

router.get('/blog', function(req, res, next) {
  res.render('darksands',{layout: false});
});
router.get('/blog1', function(req, res, next) {
  res.render('blog1', {layout: false});
});
router.get('/add-blog', async(req, res) => {
  res.render('blog-entry')
})
router.post('/add-blog', async (req, res) => {
    try {
      const blog = new Blog({
        title: req.body.title,
        author: req.body.author,
        category: req.body.category,
        content: req.body.content



      });
      
      const savedBlog = await blog.save();
      console.log(savedBlog)
      res.status(201).json(savedBlog);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/all-blogs' , async(req , res) => {
    try {
        const blogs = await Blog.find({}).lean()
        console.log(blogs)
        res.render('all-blogs', { blogs })
    } catch (error) {
      console.log(error.message);
      res.status(500).json({message: error.message})
    }
   });
   router.delete('/blogs/:id', async (req, res) => {
    try {
      const blogId = req.params.id;
      await Blog.findByIdAndDelete(blogId); // Delete the blog by ID
      res.status(200).send({ success: true });
    } catch (error) {
      console.error('Error deleting blog:', error);
      res.status(500).send({ success: false, message: 'Failed to delete the blog.' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      let blog = await Blog.findById(req.params.id).lean();
      console.log(blog);
      
      // Combine the blog data and the layout option into a single object
      res.render('blog', { blog, layout: false });
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).send('Error fetching blog');
    }
  });
module.exports = router
