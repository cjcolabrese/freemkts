const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
var request = require("request");

var mongoose = require("mongoose");
var axios = require("axios");
const fs = require("node:fs");
var Stock = require("../models/Stock");
var Search = require("../models/Search");
var User = require("../models/User");
var Note = require("../models/Note");
var dotenv = require('dotenv')
const { profile } = require("node:console");
dotenv.config({ path: "./config/config.env" });
var responseTime = require('response-time');
const setUserData = require("../middleware/setUserData");
const puppeteer = require('puppeteer');
const rapidApiKey = process.env.RAPID_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
var moment = require('moment');


const FRED_API_KEY = '9e761a35f6028eadbf45b04e5c8d0f79';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';
const SERIES_DESCRIPTIONS = {
  'PALLFNFINDEXQ': 'Global Price Index of All Commodities',
  'DCOILWTICO': 'Crude Oil Prices: West Texas Intermediate',
  'DCOILBRENTEU': 'Crude Oil Prices: Brent',
  'PCOPPUSDM': 'Global price of Copper',
  'PWHEAMTUSDM': 'Global price of Wheat',
  'PNRGINDEXM': 'Global price of Energy index',
  'PALUMUSDM': ' Global price of Aluminum',
  'PNICKUSDM': 'Global price of Nickel',
  'PIORECRUSDM': 'Global price of Iron Ore',
  'GASDESW': 'US Diesel Sales Price',
  'PCOTTINDUSDM': 'Global price of Cotton',
  'PFOODINDEXM': 'Global price of Food index',
  'PPIACO': 'Producer Price Index by Commodity: All Commodities',

};

const getCommoditiesData = async (series_id) => {
    try {
        const response = await axios.get(FRED_BASE_URL, {
            params: {
                series_id: series_id,
                api_key: FRED_API_KEY,
                file_type: 'json',
                observation_start: '2024-01-02',
                observation_end: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0] // Yesterday's date
            }
        });
        console.log(`Data for ${series_id}:`, response.data); // Log the raw data
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch data for ${series_id}: ${error.message}`);
    }
  };
  

  router.get('/all-commodities', ensureAuth, async (req, res) => {
    try {
        const seriesIds = Object.keys(SERIES_DESCRIPTIONS);
        const requests = seriesIds.map(id => getCommoditiesData(id));
        const results = await Promise.all(requests);

        const data = {};
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

        seriesIds.forEach((id, index) => {
            const observations = results[index].observations;

            if (!observations || observations.length === 0) {
                console.warn(`No observations for ${id}`);
                data[SERIES_DESCRIPTIONS[id]] = {
                    symbol: id,
                    observation: null,
                    performance30Day: "No data available",
                    performanceYTD: "No data available",
                    performanceL12M: "No data available"
                };
                return;
            }

            observations.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Logging observations for debugging
            console.log(`Observations for ${id}:`, observations);

            const recentObservations = observations.filter(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservations = observations.filter(obs => new Date(obs.date) >= new Date(now.getFullYear(), 0, 1));
            const last12MonthsObservations = observations.filter(obs => new Date(obs.date) >= twelveMonthsAgo);

            // Logging filtered results
            console.log(`Recent observations for ${id}:`, recentObservations);
            console.log(`YTD observations for ${id}:`, ytdObservations);

            const mostRecentObservation = observations[observations.length - 1];
            const thirtyDaysAgoObservation = recentObservations[0] || mostRecentObservation;
            const ytdObservation = ytdObservations[0] || mostRecentObservation;
            const last12MonthsObservation = last12MonthsObservations[0] || mostRecentObservation;

            const thirtyDaysAgoPrice = thirtyDaysAgoObservation ? parseFloat(thirtyDaysAgoObservation.value) : null;
            const ytdPrice = ytdObservation ? parseFloat(ytdObservation.value) : null;
            const last12MonthsPrice = last12MonthsObservation ? parseFloat(last12MonthsObservation.value) : null;
            const mostRecentPrice = mostRecentObservation ? parseFloat(mostRecentObservation.value) : null;

            const performance30Day = (thirtyDaysAgoPrice && mostRecentPrice)
                ? ((mostRecentPrice - thirtyDaysAgoPrice) / thirtyDaysAgoPrice * 100).toFixed(2)
                : "No data available";
            const performanceYTD = (ytdPrice && mostRecentPrice)
                ? ((mostRecentPrice - ytdPrice) / ytdPrice * 100).toFixed(2)
                : "No data available";
            const performanceL12M = (last12MonthsPrice && mostRecentPrice)
                ? ((mostRecentPrice - last12MonthsPrice) / last12MonthsPrice * 100).toFixed(2)
                : "No data available";

            data[SERIES_DESCRIPTIONS[id]] = {
                symbol: id,
                observation: mostRecentObservation,
                performance30Day: performance30Day,
                performanceYTD: performanceYTD,
                performanceL12M: performanceL12M
            };
        });

        console.log(data);
        res.render('finished/commodities', { data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

  







router.get('/:id', ensureAuth, async (req, res) => {
  const symbol = req.params.id;
  const description = SERIES_DESCRIPTIONS[symbol] || 'Description not available';

  try {
      // Fetch data for the specific symbol
      const data = await getCommoditiesData(symbol);
      const observations = data.observations;

      // Filter observations for the last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const filteredObservations = observations.filter(obs => {
          const date = new Date(obs.date);
          return date >= oneYearAgo && !isNaN(parseFloat(obs.value));
      });

      // Find the most recent observation
      const mostRecentObservation = filteredObservations.length
          ? filteredObservations[filteredObservations.length - 1]
          : null;

      // Find the highest and lowest values
      const values = filteredObservations.map(obs => parseFloat(obs.value)).filter(val => !isNaN(val));
      const highestValue = values.length ? Math.max(...values) : null;
      const lowestValue = values.length ? Math.min(...values) : null;

      // Calculate standard deviation
      const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);
      console.log("Standard Deviation:"+ standardDeviation)
      // Pass data to the template
      res.render('finished/commodity', {
          symbol,
          description,
          mostRecentObservation,
          highestValue,
          lowestValue,
          standardDeviation,
          observations: JSON.stringify(filteredObservations) // Pass observations as JSON string
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});



module.exports = router;