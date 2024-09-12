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


const FRED_API_KEY = '9e761a35f6028eadbf45b04e5c8d0f79';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';
const SERIES_DESCRIPTIONS = {
    'DEXUSEU': 'USD to Euro €',
    'DEXJPUS': 'Japanese Yen to USD ¥',
    'DEXCHUS': 'Chinese Yuan to USD ¥',
    'DEXCAUS': 'Canadian Dollar to USD $',
    'DEXKOUS': 'South Korean Won to USD ₩',
    'DEXMXUS': 'Mexican Peso to USD $',
    'DEXINUS': 'Indian Rupee to USD ₹',
    'DEXUSAL': 'USD to Australian Dollar $',
    'DEXTHUS': 'Thai Baht to USD ฿',
    'DEXSLUS': 'Sri Lankan Rupees to USD ₨',
    'DEXMAUS': 'Malaysian Ringgit to USD RM',
    'DEXSZUS': 'Swiss Francs to USD CHF',
    'DEXSFUS': 'South African Rand to USD R',
    'DEXSIUS': 'Singapore Dollars to U.S. Dollar',
    'DEXNOUS': 'Norwegian Kroner to U.S. Dollar',
    'DEXSDUS': 'Swedish Kronor to U.S. Dollar',
    'DEXDNUS': 'Danish Kroner to U.S. Dollar',
    'DEXUSNZ': 'U.S. Dollars to New Zealand Dollar'
    
};

// Function to get data for a single currency
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


// Route to get all currencies with performance calculation
const calculateDailyReturns = (observations) => {
    let returns = [];
    for (let i = 1; i < observations.length; i++) {
        const prevValue = parseFloat(observations[i - 1].value);
        const currentValue = parseFloat(observations[i].value);
        const dailyReturn = (currentValue - prevValue) / prevValue;
        returns.push(dailyReturn);
    }
    return returns;
};

// Function to calculate VaR (Value at Risk)
const calculateVaR = (returns, confidenceLevel = 0.95) => {
    returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * returns.length);
    return Math.abs(returns[index]); // VaR is usually positive, representing a potential loss
};

// Modify the existing router to include VaR calculation
router.get('/all-currencies', ensureAuth, async (req, res) => {
    try {
        const seriesIds = Object.keys(SERIES_DESCRIPTIONS);
        const requests = seriesIds.map(id => getCurrencyData(id));
        const results = await Promise.all(requests);

        const data = {};
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

        seriesIds.forEach((id, index) => {
            const observations = results[index].observations;
            observations.sort((a, b) => new Date(a.date) - new Date(b.date));

            const filteredObservations = observations.filter(obs => new Date(obs.date) >= twelveMonthsAgo);
            const returns = calculateDailyReturns(filteredObservations);
            const var95 = calculateVaR(returns, 0.95); // 95% VaR

            const recentObservations = observations.filter(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservations = observations.filter(obs => new Date(obs.date) >= new Date(now.getFullYear(), 0, 1));
            const last12MonthsObservations = observations.filter(obs => new Date(obs.date) >= twelveMonthsAgo);

            const thirtyDaysAgoObservation = recentObservations.find(obs => new Date(obs.date) >= thirtyDaysAgo);
            const ytdObservation = ytdObservations[0];
            const last12MonthsObservation = last12MonthsObservations[0];
            const mostRecentObservation = recentObservations.length ? recentObservations[recentObservations.length - 1] : null;

            const thirtyDaysAgoPrice = thirtyDaysAgoObservation ? parseFloat(thirtyDaysAgoObservation.value) : null;
            const ytdPrice = ytdObservation ? parseFloat(ytdObservation.value) : null;
            const last12MonthsPrice = last12MonthsObservation ? parseFloat(last12MonthsObservation.value) : null;
            const mostRecentPrice = mostRecentObservation ? parseFloat(mostRecentObservation.value) : null;

            const performance30Day = (thirtyDaysAgoPrice && mostRecentPrice)
                ? ((mostRecentPrice - thirtyDaysAgoPrice) / thirtyDaysAgoPrice * 100).toFixed(2)
                : null;
            const performanceYTD = (ytdPrice && mostRecentPrice)
                ? ((mostRecentPrice - ytdPrice) / ytdPrice * 100).toFixed(2)
                : null;
            const performanceL12M = (last12MonthsPrice && mostRecentPrice)
                ? ((mostRecentPrice - last12MonthsPrice) / last12MonthsPrice * 100).toFixed(2)
                : null;

            data[SERIES_DESCRIPTIONS[id]] = {
                symbol: id,
                observation: mostRecentObservation,
                performance30Day: performance30Day,
                performanceYTD: performanceYTD,
                performanceL12M: performanceL12M,
                VaR95: var95  // 95% Value at Risk
            };
        });

        res.render('finished/currencies', { data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', ensureAuth, async (req, res) => {
    const symbol = req.params.id;
    const description = SERIES_DESCRIPTIONS[symbol] || 'Description not available';

    try {
        const data = await getCurrencyData(symbol);
        const observations = data.observations;

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const filteredObservations = observations.filter(obs => {
            const date = new Date(obs.date);
            return date >= oneYearAgo && !isNaN(parseFloat(obs.value));
        });

        const returns = calculateDailyReturns(filteredObservations);
        const var95 = calculateVaR(returns, 0.95); // 95% VaR

        const mostRecentObservation = filteredObservations.length
            ? filteredObservations[filteredObservations.length - 1]
            : null;

        const values = filteredObservations.map(obs => parseFloat(obs.value)).filter(val => !isNaN(val));
        const highestValue = values.length ? Math.max(...values) : null;
        const lowestValue = values.length ? Math.min(...values) : null;

        const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);

        res.render('finished/currency', {
            symbol,
            description,
            mostRecentObservation,
            highestValue,
            lowestValue,
            standardDeviation,
            VaR95: var95,  // 95% Value at Risk
            observations: JSON.stringify(filteredObservations)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});













module.exports = router;