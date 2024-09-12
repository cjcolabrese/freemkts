const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
var request = require("request");
var axios = require("axios");
var mongoose = require("mongoose");
var axios = require("axios");
const fs = require("node:fs");
var Stock = require("../models/Stock");
var Search = require("../models/Search");

var User = require("../models/User");
var Note = require("../models/Note");
const Industries = require("../models/SymbolIndustries");
const dotenv = require("dotenv");
const { profile } = require("node:console");
dotenv.config({ path: "./config/config.env" });
var responseTime = require("response-time");
const setUserData = require("../middleware/setUserData");
const puppeteer = require("puppeteer");
var fetch = require("node-fetch");
const rapidApiKey = process.env.RAPID_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const finnhub = require("finnhub");











router.get("/ipos", ensureAuth, async (req, res) => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Navigate to the IPOs page
        await page.goto("https://stockanalysis.com/ipos/", { waitUntil: "networkidle2" });

        // Wait for the table to be loaded
        await page.waitForSelector("table");

        // Extract table data
        const tableData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("table tbody tr"));
            return rows.map((row) => {
                const cells = Array.from(row.querySelectorAll("td"));
                return {
                    date: cells[0]?.innerText.trim() || "",
                    symbol: cells[2]?.innerText.trim() || "",
                    company: cells[1]?.innerText.trim() || "",
                    price: cells[3]?.innerText.trim() || "",
                    current: cells[4]?.innerText.trim() || "",
                    return: cells[5]?.innerText.trim() || "",
                };
            });
        });

        if (!Array.isArray(tableData) || tableData.length === 0) {
            throw new Error("No data found or data is in an unexpected format.");
        }

        await browser.close();

        // Send the IPO data as JSON
        res.render("finished/ipos", { tableData });
    } catch (error) {
        console.error("Error fetching IPO data:", error.message);

        if (!res.headersSent) {
            res.status(500).json({
                error: "An error occurred while fetching IPO data.",
                message: error.message,
            });
        }
    }
});

router.get("/corporate-actions",ensureAuth, async (req, res) => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto("https://stockanalysis.com/actions/", { waitUntil: "networkidle2" });

        // Wait for the table to be loaded
        await page.waitForSelector("table");

        // Extract and log the raw HTML for debugging (optional)
        // const rawHTML = await page.content();
        // console.log('Raw HTML:', rawHTML);

        // Extract table data
        const tableData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("table tbody tr"));
            return rows.map((row) => {
                const cells = Array.from(row.querySelectorAll("td"));
                return {
                    Date: cells[0]?.innerText.trim() || "",
                    Symbol: cells[1]?.innerText.trim() || "",
                    Type: cells[2]?.innerText.trim() || "",
                    Action: cells[3]?.innerText.trim() || "",
                };
            });
        });

        if (!Array.isArray(tableData) || tableData.length === 0) {
            throw new Error("No data found or data is in an unexpected format.");
        }

        await browser.close();

        // Render the 'corporate-actions' template with the tableData
        res.render("finished/corporate-actions", { tableData });
    } catch (error) {
        console.error("Error fetching corporate actions:", error.message);

        if (!res.headersSent) {
            res.status(500).json({
                error: "An error occurred while fetching corporate actions data.",
                message: error.message,
            });
        }
    }
});
router.get("/corporate-actions/:year", ensureAuth, async (req, res) => {
    const year = req.params.year;
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        const url = `https://stockanalysis.com/actions/${year}`;
        console.log("Navigating to URL:", url);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // Increased timeout

        // Wait for the table to be loaded
        await page.waitForSelector("table", { timeout: 60000 }); // Increased timeout

        // Extract and log the raw HTML for debugging
        const rawHTML = await page.content();
        console.log("Raw HTML:", rawHTML);

        // Extract table data
        const tableData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("table tbody tr"));
            return rows.map((row) => {
                const cells = Array.from(row.querySelectorAll("td"));
                return {
                    Date: cells[0]?.innerText.trim() || "",
                    Symbol: cells[1]?.innerText.trim() || "",
                    Type: cells[2]?.innerText.trim() || "",
                    Action: cells[3]?.innerText.trim() || "",
                };
            });
        });

        if (!Array.isArray(tableData) || tableData.length === 0) {
            throw new Error("No data found or data is in an unexpected format.");
        }

        await browser.close();

        res.render("corporate-actions", { tableData });
    } catch (error) {
        console.error("Error fetching corporate actions:", error.message);

        if (!res.headersSent) {
            res.status(500).json({
                error: "An error occurred while fetching corporate actions data.",
                message: error.message,
            });
        }
    }
});

router.get("/stocks", ensureAuth, async (req, res) => {
    try {
        const users = await User.find({}, "stocks");
        const stocks = users.map((user) => user.stocks).flat();
        res.json({ stocks });
    } catch (error) {
        console.error("Error fetching stocks:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

///CREATION CODE ZONE //////////////////////

router.get("/income-statement/:id", ensureAuth, async (req, res) => {
    const company = req.params.id;
    console.log(`Fetching income statement for company: ${company}`);

    try {
        const response = await fetch(`https://financialmodelingprep.com/api/v3/income-statement/${company}?period=annual&apikey=${FMP_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        var g = data.reverse();
        console.log(g);
        res.render("finished/income-statement", { incomeStatement: g });
    } catch (error) {
        console.error("Error fetching income statement data:", error);
        res.status(500).send("Error fetching income statement data");
    }
});

router.get("/balance-sheet/:id", ensureAuth, async (req, res) => {
    const company = req.params.id;
    console.log(`Fetching balance sheetfor company: ${company}`);

    try {
        const response = await fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${company}?period=annual&apikey=${FMP_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        var g = data.reverse();
        console.log(g);
        res.render("finished/balance-sheet", { balanceSheet: g });
    } catch (error) {
        console.error("Error fetching income statement data:", error);
        res.status(500).send("Error fetching income statement data");
    }
});

router.get("/cashflow-statement/:id", ensureAuth, async (req, res) => {
    const company = req.params.id;
    console.log(`Fetching Cashflow Statement for company: ${company}`);

    try {
        const response = await fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${company}?period=annual&apikey=${FMP_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        var g = data.reverse();
        console.log(g);
        res.render("finished/cashflow-statement", { cashFlowStatement: g });
    } catch (error) {
        console.error("Error fetching income statement data:", error);
        res.status(500).send("Error fetching income statement data");
    }
});

//Gainers and Losers, Most Active
router.get("/gainers", ensureAuth, function (req, res) {
    console.log("GET /stocks/gainers");
    var fullUrl = `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${process.env.FMP_API_KEY}&limit=10`;

    request(fullUrl, function (error, response, results) {
        if (!error && response.statusCode == 200) {
            var responseData = JSON.parse(results);
            console.log(responseData);

            res.render("finished/gainers", { response: responseData });
        } else {
            res.status(500).send("Failed to fetch gainers data");
        }
    });
});
router.get("/losers", ensureAuth, function (req, res) {
    console.log("GET /stocks/losers");
    var fullUrl = `https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${process.env.FMP_API_KEY}&limit=10`;

    request(fullUrl, function (error, response, results) {
        if (!error && response.statusCode == 200) {
            var responseData = JSON.parse(results);
            console.log(responseData);

            res.render("finished/losers", { response: responseData });
        } else {
            res.status(500).send("Failed to fetch losers data");
        }
    });
});

router.get("/most-active", ensureAuth, async function (req, res) {
    console.log("/stocks/most-active");

    const mostActiveUrl = `https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${process.env.FMP_API_KEY}`;

    try {
        // Fetch most active stocks
        const response = await fetch(mostActiveUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch most active stocks (${response.status}): ${response.statusText}`);
        }

        const mostActiveData = await response.json();
        console.log("Most active stocks:", mostActiveData);

        // Render the most-active view with the fetched data
        res.render("finished/most-active", { obj: mostActiveData });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});
router.get("/sectors", ensureAuth, function (req, res) {
    console.log("GET /stocks/sectors");
    var sectorsUrl = "https://financialmodelingprep.com/api/v3/sector-performance?apikey=" + process.env.FMP_API_KEY;
    request(sectorsUrl, function (error, response, results) {
        if (!error && response.statusCode == 200) {
            fs.writeFile("data/sectors", results, function (err) {
                //console.log(results)
                var obj = JSON.parse(results);
                console.log(obj);
                console.log("The file was saved as sectors.json");
                res.render("sectors", { obj });
                //res.render('news', { obj });
                if (err) {
                    return console.log(err);
                }
            });
        }
    });
});

router.get("/stocks", async (req, res) => {
    try {
        const users = await User.find({}, "stocks");
        const stocks = users.map((user) => user.stocks).flat();
        res.json({ stocks });
    } catch (error) {
        console.error("Error fetching stocks:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

router.get("/stocks-json", ensureAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("stocks");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user.stocks);
    } catch (error) {
        console.error("Error fetching user stocks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/peers/:id", ensureAuth, (req, res) => {
    console.log("GET /stocks/" + req.params.id);
    const symbol = req.params.id;
  
    const seekingAlphaOptions = {
      method: "GET",
      url: "https://seeking-alpha.p.rapidapi.com/symbols/get-peers",
      qs: { symbol: symbol },
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "seeking-alpha.p.rapidapi.com",
      },
    };
  
    request(seekingAlphaOptions, (error, response, body) => {
      if (error) {
        console.error("Error occurred:", error);
        return res.status(500).send("Internal Server Error");
      }
  
      let data;
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.error("Response body:", body);
        return res.status(500).send("Error parsing response from Seeking Alpha");
      }
  
      const peers = data?.data?.map((item) => ({
        id: item.id,
        slug: item.attributes.slug,
        name: item.attributes.name,
        exchange: item.attributes.exchange,
        company: item.attributes.company,
        followersCount: item.attributes.followersCount,
        articleRtaCount: item.attributes.articleRtaCount,
        newsRtaCount: item.attributes.newsRtaCount,
      }));
  
      if (!peers.length) {
        return res.render("peers", { symbol, peers: [] });
      }
  
      const peerSymbols = peers.map((peer) => peer.slug).join(",");
  
      const fmpOptions = {
        method: "GET",
        url: `https://financialmodelingprep.com/api/v3/profile/${peerSymbols}?apikey=${FMP_API_KEY}`,
      };
  
      request(fmpOptions, (error, response, body) => {
        if (error) {
          console.error("Error occurred:", error);
          return res.status(500).send("Internal Server Error");
        }
  
        let profileData;
        try {
          profileData = JSON.parse(body);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          console.error("Response body:", body);
          return res.status(500).send("Error parsing response from FMP");
        }
  
        peers.forEach((peer) => {
          const profile = profileData.find((p) => p.symbol === peer.slug);
          if (profile) {
            peer.profile = profile;
          }
        });
  
        console.log("Peers with profiles:", JSON.stringify(peers, null, 2)); // Debugging output
  
        res.render("peers", { symbol, peers });
      });
    });
  });

router.get("/:id", ensureAuth, async (req, res) => {
    console.log("GET /stocks/" + req.params.id);
    const symbol = encodeURIComponent(req.params.id);
    const apiKey = process.env.FMP_API_KEY;
    const rapidapiKey = process.env.RAPID_API_KEY;
  
    // Fetching financial data using fetch
    const apiRequest1 = fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=annual&apikey=${apiKey}&limit=1`).then((response) => response.json());
    const apiRequest2 = fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?period=annual&apikey=${apiKey}&limit=1`).then((response) => response.json());
    const apiRequest3 = fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?period=annual&apikey=${apiKey}&limit=1`).then((response) => response.json());
    const apiRequest4 = fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`).then((response) => response.json());
    const apiRequest7 = fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`).then((response) => response.json());
  
    // Fetching stock peers using request
    const apiRequest5 = new Promise((resolve, reject) => {
      const options = {
        method: "GET",
        url: "https://seeking-alpha.p.rapidapi.com/symbols/get-peers",
        qs: { symbol },
        pageSize: 3,
        headers: {
          "x-rapidapi-key": process.env.RAPID_API_KEY,
          "x-rapidapi-host": "seeking-alpha.p.rapidapi.com",
        },
      };
  
      request(options, function (error, response, body) {
        if (error) {
          return reject(error);
        }
  
        let data;
        try {
          data = JSON.parse(body);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          console.error("Response body:", body);
          return res.status(500).send({ error: "Failed to parse response" });
        }
  
        const peers = data?.data?.map((item) => ({
          id: item.id,
          slug: item.attributes.slug,
          name: item.attributes.name,
          exchange: item.attributes.exchange,
          company: item.attributes.company,
          followersCount: item.attributes.followersCount,
          articleRtaCount: item.attributes.articleRtaCount,
          newsRtaCount: item.attributes.newsRtaCount,
        }));
        resolve(peers);
        console.log(peers)
      });
    });
  
    // Fetching headlines from CNBC
    const apiRequest6 = new Promise((resolve, reject) => {
      const options = {
        method: "GET",
        url: "https://cnbc.p.rapidapi.com/news/v2/list-by-symbol",
        qs: {
          page: "1",
          pageSize: "20",
          symbol: symbol,
        },
        headers: {
          "x-rapidapi-key": "dce0130264mshe2e1fe77d4fa23cp1336cdjsn53a8ebfbcec7",
          "x-rapidapi-host": "cnbc.p.rapidapi.com",
        },
      };
  
      request(options, function (error, response, body) {
        if (error) {
          return reject(error);
        }
  
        let data;
        try {
          data = JSON.parse(body);
          console.log(data);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          console.error("Response body:", body);
          return res.status(500).send({ error: "Failed to parse response" });
        }
  
        const headlines = data?.data?.symbolEntries?.results?.map((result) => ({
          id: result.id,
          headline: result.headline,
          description: result.description,
          dateFirstPublished: result.dateFirstPublished,
          url: result.url,
        }));
        resolve(headlines);
      });
    });
  
    // Combining all API requests
    Promise.all([apiRequest1, apiRequest2, apiRequest3, apiRequest4, apiRequest5, apiRequest6, apiRequest7])
      .then(function (data) {
        const incomeStatement = data[0];
        const balanceSheet = data[1];
        const cashFlow = data[2];
        const profilePage = data[3];
        const peers = data[4];
        const headlines = data[5];
        const quote = data[6];
  
        // Combine all data into a single object
        const combinedData = {
          incomeStatement,
          balanceSheet,
          cashFlow,
          profilePage,
          peers,
          headlines,
          quote,
        };
  
        // Render the data in the financials template
        res.render("finished/profile", { combinedData });
      })
      .catch(function (error) {
        console.log("Error fetching data:", error);
        res.status(500).send("Error fetching data");
      });
  });




router.post("/search", ensureAuth, async (req, res) => {
    const searchTerm = req.body.search;

    if (!searchTerm) {
        return res.status(400).send("Search term is required");
    }

    try {
        // Assuming the search term is valid and just returning it for now
        console.log(`Received search term: "${searchTerm}"`);

        res.status(200).json({ searchTerm });
    } catch (error) {
        console.error("Error handling search term:", error);
        res.status(500).send("Internal server error");
    }
});



router.get("/searches", ensureAuth, async (req, res) => {
    try {
        const users = await User.find({}, "searches");
        const searches = users.map((user) => user.searches).flat();
        res.JSON({ searches });
    } catch (error) {
        console.error("Error fetching searches:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

router.get("/sec/:cik", ensureAuth, (req, res) => {
    const cik = req.params.cik;
    const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=10-K`;

    // Redirect to the SEC 10-K page
    res.redirect(secUrl);
});

router.get("/key-metrics/:id", ensureAuth, async (req, res) => {
    const company = req.params.id;
    const url = `https://financialmodelingprep.com/api/v3/key-metrics/${company}?period=annual&apikey=${FMP_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const keyMetrics = await response.json();
        // Assuming data is an array of metrics objects

        res.render("key-metrics", { keyMetrics });
    } catch (error) {
        console.error("Error fetching key metrics data:", error);
        res.status(500).send("Error fetching key metrics data");
    }
});

const finnhubApiKey = "bs2v967rh5r9f6app8q0"; // Replace with your actual Finnhub API key

router.get("/fundamentals/:id",ensureAuth, async (req, res) => {
    const { id } = req.params;
    const apiUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${id}&metric=all&token=${finnhubApiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();

        // Extract relevant metrics for the table
        const metrics = data.metric;
        const tableRows = Object.entries(metrics)
            .map(([key, value]) => {
                // Add spaces between words and numbers in the metric name, capitalize each word, and fully capitalize three-letter words
                const spacedKey = key
                    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add spaces between lowercase and uppercase letters
                    .replace(/([a-zA-Z])(\d)/g, "$1 $2") // Add spaces between letters and numbers
                    .replace(/_/g, " ") // Replace underscores with spaces
                    .replace(/\b\w{3}\b/g, (word) => word.toUpperCase()) // Fully capitalize three-letter words
                    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word

                return `<tr><td>${spacedKey}</td><td>${value}</td></tr>`;
            })
            .join("");

        // Generate the HTML table
        const htmlTable = `
            <table border="1" class="example">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;

        // Send the HTML table as the response
        res.send(htmlTable);
    } catch (error) {
        console.error("Error fetching data from Finnhub:", error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;