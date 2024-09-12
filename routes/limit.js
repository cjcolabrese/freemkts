const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
var request = require("request");
var axios = require("axios");
var mongoose = require("mongoose");
var axios = require("axios");
const fs = require("node:fs");
var Search = require("../models/Search");
var Stock = require('../models/Stock')
var User = require("../models/User");
const dotenv = require("dotenv");
const { profile } = require("node:console");
dotenv.config({ path: "./config/config.env" });


router.get('/searchform', ensureAuth, async(req, res) => {
  res.render('searchform')
})



router.post('/save-search', ensureAuth, async (req, res) => {
  const userId = req.user?.id;
  const searchTerm = req.body?.search;

  console.log('User ID:', userId);
  console.log('Search Term:', searchTerm);

  if (!userId || !searchTerm) {
    console.error('User ID or search term is missing');
    return res.status(400).send('User ID and search term are required');
  }

  try {
    // Create a new search document
    const search = new Search({ term: searchTerm });
    await search.save();
    console.log('Search term saved to Search collection');

    // Find the user and update their searches
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }

    user.searches.push(search._id); // Push only the ID of the search document
    await user.save();
    console.log('Search term saved to User collection');

    // Retrieve the 2 most recent searches
    const recentSearches = await Search.find({ _id: { $in: user.searches } })
      .sort({ createdAt: -1 })
      .limit(2);
    
    res.status(200).json({ message: 'Search term saved successfully', recentSearches });
  } catch (error) {
    console.error('Error saving search term:', error);
    res.status(500).send('Internal server error');
  }
});


module.exports = router;


