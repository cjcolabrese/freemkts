const express = require('express');
const mongoose = require('mongoose');
const Industries = require("../models/StockByIndustry");
const router = express.Router();

// Route to find the industry for the symbol 'AAPL'
router.get('/industry', async (req, res) => {
    try {
        const query = { symbol: "SPOT" };
        console.log('Query:', query);

        // Fetch the industry record from the database
        const industryRecord = await Industries.find(query).lean();
        console.log('Result:', industryRecord);

        // Check if any record was found
        if (!industryRecord || industryRecord.length === 0) {
            console.log('No industry found for the symbol:', query.symbol);
            return res.status(404).json({ error: 'Industry not found for the symbol' });
        }

        res.json(industryRecord);
    } catch (error) {
        // Log the error with additional information
        console.error('Error fetching industry:', error.message);
        console.error('Request URL:', req.originalUrl);
        console.error('Request Query:', req.query);
        console.error('Error Stack Trace:', error.stack);

        res.status(500).json({
            error: 'An error occurred while fetching the industry.',
            message: error.message,
        });
    }
});



router.get('/industry/all', async (req, res) => {
    try {
        const query = { symbol: 'META' };
        console.log('Query:', query);
        const industryRecord = await Industries.find({});
        console.log('Result:', industryRecord);

        if (!industryRecord) {
            return res.status(404).json({ error: 'Industry not found for the symbol' });
        }

        res.json(industryRecord);
    } catch (error) {
        console.error('Error fetching industry:', error.message);
        res.status(500).json({
            error: 'An error occurred while fetching the industry.',
            message: error.message,
        });
    }
});
const Stocks = require('../models/Stock');
router.get('/stocks', async (req, res) => {
    try {
        const stocks = await Stocks.find({symbol: 'META'}).lean();
        console.log('Stocks found:', stocks.length);

        if (!stocks || stocks.length === 0) {
            return res.status(404).json({ error: 'No stocks found' });
        }

        res.json(stocks);
    } catch (error) {
        console.error('Error fetching stocks:', error.message);
        res.status(500).json({
            error: 'An error occurred while fetching the stocks.',
            message: error.message,
        });
    }
});

router.get('/combine', function(req, res) {
    async function combineCollections() {
        const uri = 'mongodb://localhost:27017/piilr'; // Replace with your MongoDB connection string
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
        try {
            await client.connect();
            const database = client.db('piilr'); // Replace with your database name
            const stocksCollection = database.collection('stocks');
            const stocksAndIndustriesCollection = database.collection('stocks-and-industries');
    
            // Get the total number of documents to process for the progress bar
            const totalDocs = await stocksCollection.countDocuments();
    
            // Initialize the progress bar
            const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
            progressBar.start(totalDocs, 0);
    
            // Use aggregation to join and merge the collections
            const result = await stocksCollection.aggregate([
                {
                    $lookup: {
                        from: 'stocks-and-industries',
                        localField: 'symbol',
                        foreignField: 'symbol',
                        as: 'industryData'
                    }
                },
                {
                    $unwind: '$industryData' // Unwind the joined array
                },
                {
                    $project: {
                        symbol: 1,
                        name: 1,
                        price: 1,
                        exchange: 1,
                        exchangeShortName: 1,
                        type: 1,
                        industry: '$industryData.industry' // Combine fields
                    }
                }
            ]).toArray();
    
            // Process each document and update the progress bar
            for (let i = 0; i < result.length; i++) {
                await database.collection('combined_stocks_and_industries').updateOne(
                    { symbol: result[i].symbol },
                    { $set: result[i] },
                    { upsert: true }
                );
                progressBar.update(i + 1);
            }
    
            // Finish the progress bar
            progressBar.stop();
    
            console.log('Data combined successfully');
        } catch (err) {
            console.error(err);
        } finally {
            await client.close();
        }
    }
    
    combineCollections();

})
module.exports = router;
