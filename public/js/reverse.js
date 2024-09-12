var request = require('request')
var fs = require('fs')
var path = require('path')

  var  options = 'https://financialmodelingprep.com/api/v3/income-statement/AAPL?period=annual&apikey=mOWqq9X8i9MNpGQF7QEL3Eo3iOLzrRGP'

  request(options, function (error, response, body) {
  var r = JSON.parse(body)
  
    fs.writeFileSync(path.join(__dirname, './public/data/aapl.json'), JSON.stringify(r, null, 2));
   console.log(r)
  });

