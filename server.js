console.log("starting...");

const HTTP_PORT = 1337;
const HTTPS_PORT = 4443;

// require('newrelic');
var cluster	= require('cluster');
var https 	= require('https');
var os		= require('os');
var url		= require('url');
var path	= require('path');
var fs		= require('fs');
var app 	= require('express')();
var util 	= require('util');

var options = {
	key:    fs.readFileSync('ssl/server.key'),
	cert:   fs.readFileSync('ssl/server.crt'),
	// requestCert:        true,
	// rejectUnauthorized: false
};

var whitelist = [
	"/campaigns/ccanotherperiod/",
	"/campaigns/culvers/",
	"/campaigns/tumblr-proto/"
];

var handlers = {};
for (var key in whitelist) {
	var webPath = whitelist[key]
	var fileSystemPath = path.join(__dirname, webPath);
	handlers[webPath] = require(fileSystemPath);
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/crossdomain.xml", function(req, res) {
	res.status(200).type("xml").send('<?xml version="1.0"?><!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd"><cross-domain-policy><site-control permitted-cross-domain-policies="all"/><allow-access-from domain="*" secure="false"/><allow-http-request-headers-from domain="*" headers="*" secure="false"/></cross-domain-policy>');		
});

app.get("*", function(req, res) {
	var webPath = url.parse(req.url).pathname;
	var fileSystemPath = path.join(__dirname, webPath);
	if (whitelist.indexOf(webPath) === -1) {
		send404(res);
		return;
	}
	var handler = handlers[webPath];
	try {
		handler.onRequest(req, res);
	} catch(e) {
		logError(e);
		send503(res);
	}
});

app.listen(HTTP_PORT, function() {
	console.log('HTTP server running on port ' + HTTP_PORT);
});
https.createServer(options, app).listen(HTTPS_PORT, function () {
    console.log('HTTPS server running on port ' + HTTPS_PORT);
});

function logError(error) {
	console.error("ERROR " + JSON.stringify(error));
	console.error(error.stack);
	console.trace();
	console.error("/ERROR " + JSON.stringify(error));
}
function send404(res) {
	res.status(404).send('404 - Not found');
}
function send503(res) {
	res.status(503).send('503 - Interal Server Error');
}