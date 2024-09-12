const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
var request = require("request");
var Rate = require('../models/Rate')
var mongoose = require("mongoose");
var axios = require("axios");
const fs = require("node:fs");
var Stock = require("../models/Stock");
var Search = require("../models/Search");
var User = require("../models/User");
var Note = require("../models/Note");
const dotenv = require("dotenv");
const { profile } = require("node:console");
dotenv.config({ path: "./config/config.env" });
var responseTime = require('response-time');
const setUserData = require("../middleware/setUserData");
const puppeteer = require('puppeteer');
const rapidApiKey = process.env.RAPID_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
var moment = require('moment');
var Rate = require('../models/Rate');

const FRED_API_KEY = '9e761a35f6028eadbf45b04e5c8d0f79';


// Helper function to get FRED data for a symbol
async function getFredData(symbol) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startDate = startOfYear.toISOString().split('T')[0]; // Format date to YYYY-MM-DD
    const endDate = now.toISOString().split('T')[0]; // Format today's date to YYYY-MM-DD

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${symbol}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDate}&observation_end=${endDate}`;

    try {
        const response = await axios.get(url);
        const observations = response.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value),
        }));
        return observations;
    } catch (error) {
        console.error(`Error fetching data for symbol ${symbol}:`, error);
        return [];
    }
}



router.get('/all-rates', ensureAuth, async (req, res) => {
    try {
        const seriesIds = Object.keys(SERIES_DESCRIPTIONS);

        // Fetch data for all currencies concurrently
        const requests = seriesIds.map(id => getCurrencyData(id));
        const results = await Promise.all(requests);

        // Fetch data from the 'rates2' collection
        const dbRates = await Rate.find({}).exec();
        console.log('Data from rates2 collection:', dbRates);

        // Calculate performance and prepare data
        const data = {};
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

        seriesIds.forEach((id, index) => {
            const observations = results[index].observations;

            // Ensure observations are sorted by date
            observations.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Filter observations
            const recentObservations = observations.filter(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservations = observations.filter(obs => new Date(obs.date) >= new Date(now.getFullYear(), 0, 1));
            const last12MonthsObservations = observations.filter(obs => new Date(obs.date) >= twelveMonthsAgo);

            // Get the price 30 days ago, YTD, and the most recent price
            const thirtyDaysAgoObservation = recentObservations.find(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservation = ytdObservations[0];
            const last12MonthsObservation = last12MonthsObservations[0];
            const mostRecentObservation = recentObservations.length ? recentObservations[recentObservations.length - 1] : null;

            // Parse values
            const thirtyDaysAgoPrice = thirtyDaysAgoObservation ? parseFloat(thirtyDaysAgoObservation.value) : null;
            const ytdPrice = ytdObservation ? parseFloat(ytdObservation.value) : null;
            const last12MonthsPrice = last12MonthsObservation ? parseFloat(last12MonthsObservation.value) : null;
            const mostRecentPrice = mostRecentObservation ? parseFloat(mostRecentObservation.value) : null;

            // Calculate performance percentages
            const performance30Day = (thirtyDaysAgoPrice && mostRecentPrice)
                ? ((mostRecentPrice - thirtyDaysAgoPrice) / thirtyDaysAgoPrice * 100).toFixed(2)
                : null;
            const performanceYTD = (ytdPrice && mostRecentPrice)
                ? ((mostRecentPrice - ytdPrice) / ytdPrice * 100).toFixed(2)
                : null;
            const performanceL12M = (last12MonthsPrice && mostRecentPrice)
                ? ((mostRecentPrice - last12MonthsPrice) / last12MonthsPrice * 100).toFixed(2)
                : null;

            // Log performance for debugging
            console.log(`30-Day Performance for ${id}:`, performance30Day);
            console.log(`YTD Performance for ${id}:`, performanceYTD);
            console.log(`Last 12 Months Performance for ${id}:`, performanceL12M);

            // Prepare data for client-side chart
            const chartData = recentObservations.map(obs => ({
                date: obs.date,
                value: parseFloat(obs.value)
            }));

            data[SERIES_DESCRIPTIONS[id]] = {
                symbol: id,
                observation: mostRecentObservation,
                performance30Day: performance30Day,  // 30-Day performance
                performanceYTD: performanceYTD,      // YTD performance
                performanceL12M: performanceL12M,    // Last 12 Months performance
                chartData: chartData                 // 30-Day history
            };
        });

        res.render('rates', { data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/all-rates-json', ensureAuth, async (req, res) => {
    console.log('-------------ALL RATES JSON-----------')
    try {
        const seriesIds = await Rate.find({});
        console.log(seriesIds)

        // Fetch data for all currencies concurrently
        const requests = seriesIds.map(id => getCurrencyData(id));
        const results = await Promise.all(requests);

        // Fetch data from the 'rates2' collection
        const dbRates = await Rate.find({}).exec();
        console.log('Data from rates2 collection:', dbRates);

        // Calculate performance and prepare data
        const data = {};
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

        seriesIds.forEach((id, index) => {
            const observations = results[index].observations;

            // Ensure observations are sorted by date
            observations.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Filter observations
            const recentObservations = observations.filter(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservations = observations.filter(obs => new Date(obs.date) >= new Date(now.getFullYear(), 0, 1));
            const last12MonthsObservations = observations.filter(obs => new Date(obs.date) >= twelveMonthsAgo);

            // Get the price 30 days ago, YTD, and the most recent price
            const thirtyDaysAgoObservation = recentObservations.find(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservation = ytdObservations[0];
            const last12MonthsObservation = last12MonthsObservations[0];
            const mostRecentObservation = recentObservations.length ? recentObservations[recentObservations.length - 1] : null;

            // Parse values
            const thirtyDaysAgoPrice = thirtyDaysAgoObservation ? parseFloat(thirtyDaysAgoObservation.value) : null;
            const ytdPrice = ytdObservation ? parseFloat(ytdObservation.value) : null;
            const last12MonthsPrice = last12MonthsObservation ? parseFloat(last12MonthsObservation.value) : null;
            const mostRecentPrice = mostRecentObservation ? parseFloat(mostRecentObservation.value) : null;

            // Calculate performance percentages
            const performance30Day = (thirtyDaysAgoPrice && mostRecentPrice)
                ? ((mostRecentPrice - thirtyDaysAgoPrice) / thirtyDaysAgoPrice * 100).toFixed(2)
                : null;
            const performanceYTD = (ytdPrice && mostRecentPrice)
                ? ((mostRecentPrice - ytdPrice) / ytdPrice * 100).toFixed(2)
                : null;
            const performanceL12M = (last12MonthsPrice && mostRecentPrice)
                ? ((mostRecentPrice - last12MonthsPrice) / last12MonthsPrice * 100).toFixed(2)
                : null;

            // Log performance for debugging
            console.log(`30-Day Performance for ${id}:`, performance30Day);
            console.log(`YTD Performance for ${id}:`, performanceYTD);
            console.log(`Last 12 Months Performance for ${id}:`, performanceL12M);

            // Prepare data for client-side chart
            const chartData = recentObservations.map(obs => ({
                date: obs.date,
                value: parseFloat(obs.value)
            }));

            data[SERIES_DESCRIPTIONS[id]] = {
                symbol: id,
                observation: mostRecentObservation,
                performance30Day: performance30Day,  // 30-Day performance
                performanceYTD: performanceYTD,      // YTD performance
                performanceL12M: performanceL12M,    // Last 12 Months performance
                chartData: chartData                 // 30-Day history
            };
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', ensureAuth, async (req, res) => {
    const symbol = req.params.id;
    const description = SERIES_DESCRIPTIONS[symbol] || 'Description not available';

    try {
        // Fetch data for the specific symbol
        const data = await getCurrencyData(symbol);
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
        res.render('rate', {
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









const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

const SERIES_DESCRIPTIONS = {
    'BAMLH0A0HYM2': 'ICE BofA US High Yield Index',
    'BAMLC0A1CAAAEY':  'AAA US Corporate Index Effective Yield',
    'BAMLH0A0HYM2EY': 'US High Yield Index Effective Yield',
    'BAMLC0A4CBBBEY': 'BBB US Corporate Index',
    'BAMLH0A3HYCEY': 'CCC & Lower US High Yield Index Effective Yield',
    'BAMLH0A1HYBBEY': 'BB US High Yield Index Effective Yield',
    'BAMLH0A2HYBEY': 'Single-B US High Yield Index Effective Yield',
    'T10Y2Y': 'Yield Curve: 10 Year and 2 Year',
};



// Route to get all currencies with performance calculation
const getCurrencyData = async (series_id) => {
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
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch data for ${series_id}: ${error.message}`);
    }
};
module.exports = router;