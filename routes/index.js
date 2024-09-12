const express = require('express')
const router = express.Router()
const { ensureAuth, ensureGuest } = require('../middleware/auth')
const dotenv = require('dotenv')
dotenv.config({ path: './config/config.env' })
var stlfsi = 'STLFSI4'
var fred = require('fred')(process.env.FRED_API_KEY);
var fs = require('fs');
const Story = require('../models/Story')
var axios = require('axios')
const http = require("https");
const User = require('../models/User');
var Stock = require('../models/Stock');
var request = require('request');
const puppeteer = require('puppeteer');
// @desc    Login/Landing page
// @route   GET /
router.get('/', function(req, res, next) {
  res.render('homepage',{layout: false});
});
router.get('/darksands', async(req, res) => {
  res.render('darksands')
})

router.get('/tabs', async(req,res) => {
  res.render('tabs')
})





module.exports = router
