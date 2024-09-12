const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const ProgressBar = require('progress');

const scrapeFRED = async () => {
  try {
    // Fetch the page content
    const { data } = await axios.get('https://fred.stlouisfed.org/searchresults?st=rates&t=&ob=p');
    const $ = cheerio.load(data);

    // Select all search results
    const searchResults = $('.search-result');
    const totalItems = searchResults.length;

    // Initialize progress bar
    const bar = new ProgressBar('Scraping [:bar] :current/:total (:percent) :etas', {
      total: totalItems,
      width: 40,
      complete: '=',
      incomplete: ' ',
    });

    const results = [];

    searchResults.each((index, element) => {
      const titleElement = $(element).find('.series-title a');
      const descriptionElement = $(element).find('.series-description');

      const title = titleElement.text().trim();
      const url = titleElement.attr('href');
      const description = descriptionElement.text().trim();

      results.push({ title, url: `https://fred.stlouisfed.org${url}`, description });

      // Update the progress bar
      bar.tick();
    });

    // Save the results to a JSON file
    const filePath = path.join(__dirname, 'fred_series_cheerio.json');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

    console.log(`\nScraping completed. Data saved to ${filePath}`);
  } catch (error) {
    console.error('An error occurred while scraping:', error);
  }
};

scrapeFRED();
