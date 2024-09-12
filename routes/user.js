const express = require("express");
const router = express.Router();
const {  ensureAuth } = require("../middleware/auth");
var request = require("request");
var axios = require("axios");
var mongoose = require("mongoose");
var axios = require("axios");
const fs = require("node:fs");
var Stock = require("../models/Stock");
var Search = require("../models/Search");
var User = require("../models/User");
var Note = require("../models/Note");
var Visit = require("../models/Visit");
const dotenv = require("dotenv");
const { profile } = require("node:console");
dotenv.config({ path: "./config/config.env" });
var responseTime = require('response-time');
const setUserData = require("../middleware/setUserData");
const rapidApiKey = process.env.RAPID_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const FRED_API_KEY = '9e761a35f6028eadbf45b04e5c8d0f79';
const Rate = require('../models/Rate');






router.get('/blog',  async(req, res) => {
  res.render('blog')
})






///////////////////////////////////////NOTES///////////////////////////////////////

router.get('/notes',  async (req, res) => {
  console.log('GET /user/notes');

  const userId = req.user.id;

  if (!userId) {
    console.error('User ID is not provided');
    return res.status(400).send('Bad request: User ID is required');
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).send('User not found');
    }

    const notes = user.notes.sort((a, b) => b.createdAt - a.createdAt);
    console.log('Notes:', notes);

    res.render('notes', { notes });
  } catch (error) {
    console.error('Error retrieving notes:', error);
    res.status(500).send('Internal server error');
  }
});
router.get('/searches',  async (req, res) => {
  try {
    const users = await User.find({}, 'searches');
    const searches = users.map(user => user.searches).flat();
    
    // Render 'searches' view with 'searches' data
    res.json(searches)
  } catch (error) {
    console.error('Error fetching searches:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/add-note',  (req, res) => {
  res.render('add-note')
})

router.post('/add-note',  async (req, res) => {
  const { symbol, name, status, note, title, date } = req.body;
  console.log(symbol)
  if (!symbol || !note) {
    return res.status(400).json({ error: 'Symbol and note are required.' });
  }

  try {
    // Find the user (assuming user ID is available in req.user)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Add the note to the user's notes
    user.notes.push({ symbol, name, note, status, date, title });

    // Save the user with the new note
    await user.save();

    res.status(200).json({ message: 'Note added successfully!' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

router.get('/visit',  async (req, res) => {
  res.render('visit')
});


router.post('/add-visit',  async (req, res) => {
  const symbol = req.body.search;
  console.log('VISIT DETECTED: '+symbol)
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required.' });
  }

  try {
    // Find the user (assuming user ID is available in req.user)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
var date = new Date();
    // Add the note to the user's notes
    user.visits.push({ symbol, date});

    // Save the user with the new note
    await user.save();

    res.status(200).json({ message: 'Visit added successfully!' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

















router.get('/login', async (req, res) => {
res.render('login')
})
////////////////////////////PROFILE////////////////////////////////

router.get('/profile',  async (req, res) => {
  res.render('profile')
});

////////////////////////////PORTFOLIO//////////////////////////////////
router.get('/portfolio',  async (req, res) => {
  console.log('GET /stocks/portfolio')

  const userId = req.user.id;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Sort the stocks array by createdAt in descending order and limit to 5 results
    /*    const recentStocks = user.stocks.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);*/
    const recentStocks = user.stocks.sort((a, b) => b.createdAt - a.createdAt);
    /*console.log(recentStocks)*/

    res.render("portfolio", { recentStocks })
       /*res.status(200).json({ recentStocks })*/;
  } catch (error) {
    console.error('Error retrieving recent stocks:', error);
    res.status(500).send('Internal server error');
  }
});
router.get('/dashboard', ensureAuth, async (req, res) => {
  const userId = req.user.id;
  const FRED_API_KEY = '9e761a35f6028eadbf45b04e5c8d0f79';
  const fredSeries = ['T10Y2Y', 'BAMLC0A1CAAAEY', 'BAMLC0A4CBBBEY', 'BAMLH0A1HYBBEY', 'BAMLH0A2HYBEY'];

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const recentStocks = user.stocks.sort((a, b) => b.createdAt - a.createdAt);
    const notes = user.notes.sort((a, b) => b.createdAt - a.createdAt);

    const users = await User.find({}, 'stocks');
    const stocks = users.map(user => user.stocks).flat().map(stock => {
      if (typeof stock === 'object' && stock !== null && stock.symbol) {
        return stock.symbol;
      }
      return String(stock);
    });

    const uniqueStocks = [...new Set(stocks)];
    const symbolsStr = uniqueStocks.join(',');

    const bulkUrl = `https://financialmodelingprep.com/api/v3/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
    const gainersUrl = `https://financialmodelingprep.com/api/v3/gainers?apikey=${FMP_API_KEY}`;
    const losersUrl = `https://financialmodelingprep.com/api/v3/losers?apikey=${FMP_API_KEY}`;
    const mostActiveUrl = `https://financialmodelingprep.com/api/v3/actives?apikey=${FMP_API_KEY}`;
    const sectorsUrl = `https://financialmodelingprep.com/api/v3/sectors-performance?apikey=${FMP_API_KEY}`;
    console.log(sectorsUrl)
    // Fetch bulk stock data
    const response = await axios.get(bulkUrl);
    const stockData = response.data;
    // Fetch stock data, gainers, losers, most active, and FRED data
    Promise.all([
      axios.get(gainersUrl).then(response => response.data.slice(0, 15)),
      axios.get(losersUrl).then(response => response.data.slice(0, 15)),
      axios.get(mostActiveUrl).then(response => response.data.slice(0, 15)),
      axios.get(sectorsUrl).then(response => response.data.slice(0, 15)),
      Promise.all(fredSeries.map(series => {
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json`;
        return axios.get(fredUrl).then(response => ({
          seriesId: series,
          data: response.data.observations
        })).catch(err => {
          console.error(`Error fetching data for ${series}:`, err);
          return { seriesId: series, data: [] };
        });
      }))
    ])
      .then(([gainers, losers, mostActive, sectors, fredData]) => {
        // Process FRED data and structure it for the charts
        const fredChartData = fredData.reduce((acc, { seriesId, data }) => {
          acc[seriesId] = data.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
          return acc;
        }, {});



        // Render the dashboard, passing an empty array for stocks if no symbols are available
        res.render("finished/dashboard", {
          recentStocks,
          gainers,
          losers,
          mostActive,
          sectors,
          fredChartData,
          stocks: uniqueStocks.length ? uniqueStocks : [] // Pass empty array if no stocks
        });

      })
      .catch(error => {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
      });

  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal server error');
  }
});



router.get("/user-stocks",  async (req, res) => {

  res.render("user-stocks");
})


router.post("/user-stocks",  async (req, res) => {
  console.log('POST /stocks/user-stocks')
  console.log('POST /user-stocks called. Request body:', req.body);

  const userId = req.user.id;
  const symbol = req.body.search;
  const apiKey = process.env.FMP_API_KEY;

  try {
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`);
    const stockData = response.data[0];

    if (!stockData) {
      console.log('Stock not found:', symbol);
      return res.status(404).json({ error: "Stock not found" });
    }

    /*console.log('Stock data received:', stockData);*/
    const { companyName, description, price, image, beta, sector } = stockData;
    const date = new Date();

    let stock = await Stock.findOne({ symbol });

    if (!stock) {
      stock = new Stock({ symbol: symbol, name: companyName, price, imageUrl: image, description: description, date: date, beta: beta, sector: sector });
      await stock.save();
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: "User not found" });
    }

    const stockExists = user.stocks.some(s => s.symbol === symbol);

    if (!stockExists) {
      user.stocks.push({
        stockId: stock._id,
        symbol: symbol,
        name: companyName,
        price: price,
        image: image,
        description: description,
        date: date,
        beta: beta,
        sector: sector,
      });
      await user.save();
    } else {
      console.log('Stock already exists in user stocks:', symbol);
      return res.status(400).json({ error: "Stock already exists in user stocks" });
    }

    console.log('Stock added to user:', symbol);
    res.json({ message: 'Stock added successfully', stocks: user.stocks });

  } catch (err) {
    console.error('Error in /user-stocks route:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/user-stocks/:symbol",  async (req, res) => {
  console.log('DELETE /user-stocks/:symbol')
  console.log('DELETE /user-stocks/:symbol called. Symbol:', req.params.symbol);

  const userId = req.user.id;
  const symbol = req.params.symbol;

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: "User not found" });
    }

    const stockIndex = user.stocks.findIndex(s => s.symbol === symbol);

    if (stockIndex === -1) {
      console.log('Stock not found in user stocks:', symbol);
      return res.status(404).json({ error: "Stock not found in user stocks" });
    }

    user.stocks.splice(stockIndex, 1);
    await user.save();

    console.log('Stock removed from user:', symbol);
    res.json({ message: 'Stock removed successfully', stocks: user.stocks });

  } catch (err) {
    console.error('Error in /user-stocks/:symbol route:', err);
    res.status(500).json({ error: err.message });
  }
});








router.get('/homepage', ensureAuth, (req, res) => {
  res.render('homepage')
})





module.exports = router
