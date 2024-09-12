///////////FINANCIALS WITHOUT PEERS///////////////
router.get('/:id', ensureAuth, async (req, res) => {
    console.log('GET /stocks/' + req.params.id);
    const symbol = encodeURIComponent(req.params.id);
    const apiKey = process.env.FMP_API_KEY;
    const rapidapiKey = process.env.RAPID_API_KEY;
  
    try {
      const apiRequest1 = fetch(
        `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=annual&apikey=${apiKey}&limit=1`
      ).then((response) => response.json());
      
      const apiRequest2 = fetch(
        `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?period=annual&apikey=${apiKey}&limit=1`
      ).then((response) => response.json());
      
      const apiRequest3 = fetch(
        `https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?period=annual&apikey=${apiKey}&limit=1`
      ).then((response) => response.json());
      
      const apiRequest4 = fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
      ).then((response) => response.json());
  
      const apiRequest7 = fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
      ).then((response) => response.json());
  
      const apiRequest5 = new Promise((resolve, reject) => {
        const options = {
          method: 'GET',
          url: 'https://seeking-alpha.p.rapidapi.com/symbols/get-peers',
          qs: { symbol },
          headers: {
            'x-rapidapi-key': rapidapiKey,
            'x-rapidapi-host': 'seeking-alpha.p.rapidapi.com'
          }
        };
  
        request(options, (error, response, body) => {
          if (error) {
            return reject(error);
          }
  
          let data;
          try {
            data = JSON.parse(body);
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            console.error('Response body:', body);
            return res.status(500).send({ error: 'Failed to parse response' });
          }
  
          const peers = data?.data?.map(item => ({
            id: item.id,
            slug: item.attributes.slug,
            name: item.attributes.name,
            exchange: item.attributes.exchange,
            company: item.attributes.company,
            followersCount: item.attributes.followersCount,
            articleRtaCount: item.attributes.articleRtaCount,
            newsRtaCount: item.attributes.newsRtaCount
          }));
          resolve(peers);
        });
      });
  
      const apiRequest6 = new Promise((resolve, reject) => {
        const options = {
          method: 'GET',
          url: 'https://cnbc.p.rapidapi.com/news/v2/list-by-symbol',
          qs: {
            page: '1',
            pageSize: '15',
            symbol: symbol,
          },
          headers: {
            'x-rapidapi-key': rapidapiKey,
            'x-rapidapi-host': 'cnbc.p.rapidapi.com'
          }
        };
  
        request(options, (error, response, body) => {
          if (error) {
            return reject(error);
          }
  
          let data;
          try {
            data = JSON.parse(body);
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            console.error('Response body:', body);
            return res.status(500).send({ error: 'Failed to parse response' });
          }
  
          const headlines = data?.data?.symbolEntries?.results?.map(result => ({
            id: result.id,
            headline: result.headline,
            description: result.description,
            dateFirstPublished: result.dateFirstPublished,
            url: result.url
          }));
          resolve(headlines);
        });
      });
  
      const [incomeStatement, balanceSheet, cashFlow, profilePage, peers, headlines, quote] = await Promise.all([
        apiRequest1,
        apiRequest2,
        apiRequest3,
        apiRequest4,
        apiRequest5,
        apiRequest6,
        apiRequest7
      ]);
  
      const peerSymbols = peers.map(peer => peer.slug).join(',');
  
      const fmpOptions = {
        method: 'GET',
        url: `https://financialmodelingprep.com/api/v3/profile/${peerSymbols}?apikey=${apiKey}`
      };
  
      request(fmpOptions, (error, response, body) => {
        if (error) {
          console.error('Error occurred:', error);
          return res.status(500).send('Internal Server Error');
        }
  
        let profileData;
        try {
          profileData = JSON.parse(body);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          console.error('Response body:', body);
          return res.status(500).send('Error parsing response from FMP');
        }
  
        peers.forEach(peer => {
  
          if (profile) {
            peer.profile = profile;
          }
        });
  
        console.log('Peers with profiles:', JSON.stringify(peers, null, 2)); // Debugging output
  
        const combinedData = {
          incomeStatement,
          balanceSheet,
          cashFlow,
          profilePage,
          headlines,
          quote,
        };
  
        res.render('financials', { combinedData });
      });
  
    } catch (error) {
      console.log('Error fetching data:', error);
      res.status(500).send('Error fetching data');
    }
  });
  