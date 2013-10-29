/*jslint white: true, browser: true, devel: true, windows: true, forin: true, vars: true, nomen: true, plusplus: true, bitwise: true, regexp: true, sloppy: true, indent: 4, maxerr: 50 */
/*global exports: true */

exports.index = function(req, res) {
    res.render('index', { title: "Blanket" });
};

exports.invite = function(req, res) {
    res.render('invite', { title: "Invite" });
};

exports.peek = function(req, res) {
    res.render('peek', { title: "Peek" });
};

exports.workspace = function(req, res) {
    res.render('workspace', { title: "Workspace" });
};

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
// exports.hello = function(req, res) {
//   res.render('hello', { message: 'Congrats, you just set up your app!' });
// };
