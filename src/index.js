const express = require('express');
// const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const http = require('http');
// const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Configuring the database
// const Config = require('./config/mongodb.config.js');

// initialize the app
const app = express();
global.appRoot = path.resolve(__dirname);

const PORT = process.env.PORT || 5006;

// Creating a Server
let server = http.createServer(app);

// // makes db connection global
// mongoose.Promise = global.Promise;

// // mongo configuration
// mongoose.set('useCreateIndex', true);
// mongoose.set('useNewUrlParser', true);
// mongoose.set('useUnifiedTopology', true);
// mongoose.set('useFindAndModify', false);

// // Connecting to the database
// mongoose.connect(Config.url)
//     .then(() => {
//         console.log("Successfully connected to MongoDB.");
//     }).catch(err => {
//         console.log('Could not connect to MongoDB.');
//         process.exit();
//     });

// defining the Middleware
app.use(cors());

// app.use(fileUpload({
//     limits: { fileSize: 50 * 1024 * 1024 },
//     useTempFiles: true,
//     tempFileDir: '/tmp/'
// }));
// Set the static folder
app.use('/public', express.static(path.join(__dirname, '../public')))

// Bodyparser Middleware
app.use(bodyParser.json({ limit: '20mb' }));

// Helmet
app.use(helmet());
// Rate Limiting
const limit = rateLimit({
    max: 100, // max requests
    windowMs: 60 * 60 * 1000, // 1 Hour of 'ban' / lockout 
    message: 'Too many requests' // message to send
});
app.use('/api', limit); // Setting limiter on specific route
// Body Parser
app.use(express.json({ limit: '10000kb' })); // Body limit is 10

// Data Sanitization against NoSQL Injection Attacks
app.use(mongoSanitize());
// Data Sanitization against XSS attacks
app.use(xss());

// Passport Middleware
// app.use(passport.initialize());
// app.use(passport.session());

// console.log('working')

// require('./routes/users.routes.js')(app);
require('./routes/app.ppt.routes.js')(app);
require('./routes/app.ppt.test.routes.js')(app);
require('./routes/ussd.routes.js')(app);
require('./routes/app.officer.routes')(app);
require('./routes/app.customer.routes')(app);
// Handler for 404 - Resource Not Found
app.use((req, res, next) => {
    res.status(404).send({ message: 'We think you are lost!' });
})

// Handler for Error 500
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({ message: 'Internal Server error!' });
});


// Start Server using environment port
server.listen(PORT, () => {
    console.info('Server is running on ' + PORT)
});

// var server = app.listen(PORT, function() {

//     var host = server.address().address
//     var port = server.address().port

//     console.log("App listening at http://%s:%s", host, port)

// });
