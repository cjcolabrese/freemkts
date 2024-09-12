const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
const dotenv = require("dotenv");
const mongoose = require('mongoose')
dotenv.config({ path: "./config/config.env" });
var stlfsi = "STLFSI4";
var fred = require("fred")(process.env.FRED_API_KEY);
var moment = require("moment");
var fs = require("fs");
const axios = require("axios");
const cors = require("cors");
var path = require("path");
var fred = require("fred")("89a1c5a2c36c2984961f4a536ed6fc55");
const RealEstate = require('../models/RealEstate');


router.get('/form', function(req, res){
  res.render('real-estate');
})
router.post('/', async (req, res) => {
  const { code, item, description } = req.body;
  try {
      const newRecord = new RealEstate({ code, item, description });
      await newRecord.save();
      console.log('Record saved:', newRecord);
      res.status(201).json(newRecord);
  } catch (err) {
      console.error('Error saving record:', err.message);
      res.status(500).json({ message: 'Failed to save record', error: err.message });
  }
});

router.get('/' , async(req , res) => {
  try {
      const items = await RealEstate.find({}).lean()
      console.log(items)
     res.render('finished/real-estate', {items})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: error.message})
  }
 });


 router.get('/:id', async function(req, res) {
  const code = req.params.id;
  
  // Fetch the item and description from the database
  const items = await RealEstate.find({ code: code }).lean();
  console.log(items);
  
  const apiKey = '89a1c5a2c36c2984961f4a536ed6fc55';
  const apiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${code}&api_key=${apiKey}&file_type=json&observation_start=2018-01-01`;
  
  try {
      const response = await axios.get(apiUrl);
      const observations = response.data.observations;

      // Process and format data
      const formattedData = observations.map(item => ({
          date: item.date,
          value: parseFloat(item.value)
      }));

      // Pass the formatted data and items directly to the template
      res.render('finished/real-estate-item', { data: formattedData, items: items });
  } catch (error) {
      console.error('Error fetching data from the Fed API:', error.message);
      res.status(500).send('Error fetching data from the Fed API');
  }
});


module.exports = router;