const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db')
var responseTime = require('response-time')
var MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const setUserData = require('./middleware/setUserData');
var hbs = require('handlebars')

dotenv.config({ path: './config/config.env' })
var store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'mySessions'
});
dotenv.config({ path: './config/config.env' })

store.on('error', function(error) {
    console.log(error);
});
// Passport ('./config/passport')(passport);
require('./config/passport')(passport)

connectDB()

const app = express()
app.use(require('express-session')({
    secret: 'This is a secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    // Boilerplate options, see:
    // * https://www.npmjs.com/package/express-session#resave
    // * https://www.npmjs.com/package/express-session#saveuninitialized
    resave: true,
    saveUninitialized: true
}));
// Body parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors());
// Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)


// Register a JSON helper to stringify objects safely
hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});
// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Handlebars Helpers
const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require('./helpers/hbs')

// Handlebars
app.engine(
  '.hbs',
  exphbs({
    helpers: {
      formatDate,
      stripTags,
      truncate,
      editIcon,
      select,
    },
    defaultLayout: 'main',
    extname: '.hbs',
  })
)
app.set('view engine', '.hbs')

hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});
// Sessions
//app.use(session({ store: MongoStore.create({ mongoUrl: process.env.MONGO_URI})}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())
app.use(responseTime((req, res, time) => {
  console.log(req.method, req.url, time + 'ms');
}));
// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})
app.use(cors());
app.use(setUserData);

// Static folder
app.use('/public', express.static(__dirname + "/public"));

// Routes
app.use('/', require('./routes/index'))
app.use('/blogs', require('./routes/blogs'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))
app.use('/stocks', require('./routes/stocks'))
app.use('/econ', require('./routes/econ'))
app.use('/realestate', require('./routes/realestate'))
app.use('/limit', require('./routes/limit'))
app.use('/user', require('./routes/user'))
app.use('/currencies', require('./routes/currencies'));
app.use('/commodities', require('./routes/commodities'));
app.use('/rates', require('./routes/rates'));
app.use('/test', require('./routes/test'));
const PORT = process.env.PORT || 3000

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
)
