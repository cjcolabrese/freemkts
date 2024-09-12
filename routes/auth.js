const express = require('express')
const passport = require('passport')
const router = express.Router()
const mongoose = require('mongoose')
const User = require('../models/User')

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile'] }))

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/user/dashboard')
  }
)
router.post('/login', passport.authenticate('local', { failureRedirect: '/login', successRedirect: '/' }));

// @desc    Logout user
// @route   /auth/logout
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/'); //Can fire before session is destroyed?
});


module.exports = router
