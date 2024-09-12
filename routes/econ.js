const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
var fred = require('fred')('89a1c5a2c36c2984961f4a536ed6fc55');
var request = require("request");
const fs = require("node:fs");
var axios = require('axios')
var path = require('path');
const dotenv = require('dotenv')
dotenv.config({ path: './config/config.env' })

var fred = require('fred')(process.env.FRED_API_KEY);

router.get("/dashboard", async (req, res) => {
  const FRED_API_KEY = "9e761a35f6028eadbf45b04e5c8d0f79";
  const GDP_SERIES_ID = "GDP";
  try {
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations`, {
      params: {
        api_key: FRED_API_KEY,
        file_type: "json",
        series_id: GDP_SERIES_ID,
      },
    });

    const gdpData = response.data.observations.map((obs) => ({
      date: obs.date,
      value: parseFloat(obs.value),
    }));
console.log(gdpData)
    res.render('econ', { gdpData })
  } catch (error) {
    console.error("Error fetching data from FRED API:", error);
    res.status(500).send("Error fetching data from FRED API");
  }
});


router.get("/fred2", async (req, res) => {
  const apiKey = "9e761a35f6028eadbf45b04e5c8d0f79";
  const seriesIds = {
    UNRATE: "UNRATE",
    CPIAUCSL: "CPIAUCSL",
    GFDEGDQ188S: "GFDEGDQ188S",
    FEDFUNDS: "FEDFUNDS",
    STLFSI: "STLFSI4"
  
  };

  try {
    // Fetch data for each series in parallel
    const responses = await Promise.all(
      Object.values(seriesIds).map((seriesId) =>
        axios.get(`https://api.stlouisfed.org/fred/series/observations`, {
          params: {
            api_key: apiKey,
            file_type: "json",
            series_id: seriesId,
          },
        })
      )
    );

    // Map the data for each series
    const data = responses.reduce((acc, response, index) => {
      const seriesId = Object.keys(seriesIds)[index];
      acc[seriesId] = response.data.observations.map((obs) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }));
      return acc;
    }, {});

    // Log data to console (for debugging)
    console.log(data);

    // Render data in template
    res.render("econ2", { data });
  } catch (error) {
    console.error("Error fetching data from FRED API:", error);
    res.status(500).send("Error fetching data from FRED API");
  }
});

router.get('/categories', (req, res) => {
  res.render('fred-categories')
});






/*router.get('/GDPC1', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/GDPC1.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});
router.get('/GDPPOT', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/GDPPOT.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});
router.get('/CPIAUCSL', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/CPIAUCSL.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});
router.get('/CPILFESL', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/CPILFESL.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});

router.get('/GDPDEF', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/GDPDEF.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});

router.get('/BASE', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/BASE.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});
router.get('/M1', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/M1.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});

router.get('/M2', async (req, res) => {
  fred.series.observations('gdp', function(err, grossNationalProduct) {
    if (!err) console.log(grossNationalProduct.observations)
      var obj = grossNationalProduct.observations;
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/M2.json'), JSON.stringify(obj), function (err) {
        if (err) throw err;
      });
      res.render('kes-results')
   console.log(err)
});
});














router.get('/fred', (req, res) => {
  res.render('kes')
})
router.get('/:series_id', async (req, res) => {
  const seriesId = req.params.series_id;
  const options = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=8bd1a1452d9b2e100be5d57451fa8bb5&file_type=json&observation_start=2020-01-01&observation_end=2024-07-01`;

  try {
      const response = await fetch(options);
      if (!response.ok) {
          throw new Error(`Network response was not ok ${response.statusText}`);
      }
      const data = await response.json();

      // Define the file path
      fs.writeFileSync(path.join(__dirname, '../public/data/econ/'+seriesId+'.json'), JSON.stringify(obj), function (err) {
        console.log('file written')
        if (err) throw err;
     
      });

      res.render('kes-results', { body: data });
  } catch (error) {
      console.error('Error fetching data from FRED API:', error);
      res.status(500).send('Internal Server Error');
  }
});*/


module.exports = router;
