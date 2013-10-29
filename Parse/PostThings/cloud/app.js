
/*jslint white: true, browser: true, devel: true, windows: true, forin: true, vars: true, nomen: true, plusplus: true, bitwise: true, regexp: true, sloppy: true, indent: 4, maxerr: 50 */
/*global require: true */

// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var pt = require('cloud/routes/pt');
var app = express();

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// Define all the endpoints
app.get('/', pt.index);
app.get('/index', pt.index);
app.get('/workspace', pt.workspace);

// Attach the Express app to Cloud Code.
app.listen();
