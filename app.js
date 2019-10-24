// Require express and create an instance of it
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const parse = require('parse-svg-path')
const extract = require('extract-svg-path')
const fs = require('fs')
const bodyParser = require("body-parser");
const session = require('express-session')
const passport = require('./config/passport');
const cookieParser = require('cookie-parser');
const Client = require('ftp');
__dirname = __dirname;
const https = require('https');
const router = require('./app/routes').routeMiddleware();

// default options
app.use(fileUpload());
app.use('/static', express.static('public'));
app.use('/images', express.static('public/images'));
app.use('/drawings', express.static('svg_files'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'oigmfhofigh',
    resave: false,
    saveUninitialized: true
            // cookie: { secure: true }
}));

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use('/', router);

// start the server in the port 3000 !
//app.listen(3000, function () {
//   console.log('Server listening on port 3000.');
//});

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;


https.createServer({
    key: fs.readFileSync('cert/colornowapp_com.key'),
    cert: fs.readFileSync('cert/colornowapp_com.crt'),
    ca: fs.readFileSync('cert/colornowapp_com.ca-bundle')
}, app).listen(3000, () => {
    console.log('Listening...')
});