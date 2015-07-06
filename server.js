require('newrelic');
// var posix	= require('posix');
var cluster	= require('cluster');
var os		= require('os');
var url		= require('url');
var path	= require('path');
var fs		= require('fs');
var whitelist = require('./whitelist.json'); // UPDATES REQUIRE RESTART
var app = require('express')();

var handlers = {};
for (var key in whitelist) {
	var webPath = whitelist[key]
	var fileSystemPath = path.join(__dirname, webPath);
	handlers[webPath] = require(fileSystemPath);
}

const PORT = 1337; //TODO: config dev/prod 

// var numCPUs = os.cpus().length;
// if (cluster.isMaster) {
// 	// posix.setrlimit('nofile', {soft:null, hard:null});
// 	for (var i = 0; i < numCPUs; i++) {
// 		cluster.fork();
// 	}
// 	//TODO: Handle children errors, stoppages, etc.
// 	cluster.on('exit', function(worker, code, signal) {
// 		console.log('worker ' + worker.process.pid + ' died');
// 		if (worker.suicide !== true) {
// 			console.log('restarting process ' + worker.id);
// 			// http.createServer(onRequest).listen(PORT);
// 		}
// 	});
// } else {
	app.get("*", function(request, response) {
		var webPath = url.parse(request.url).pathname;
		// console.log("webPath: " + webPath);
		var fileSystemPath = path.join(__dirname, webPath);
		// console.log("fileSystemPath: " + fileSystemPath);
		if (webPath === "/crossdomain.xml") {
			response.status(200).type("xml").send('<cross-domain-policy><site-control permitted-cross-domain-policies="all"/><allow-access-from domain="*" secure="false"/><allow-http-request-headers-from domain="*" headers="*" secure="false"/></cross-domain-policy>');
			// response.status(200).sendFile(__dirname + '/crossdomain.xml');
			return;
		}
		if (whitelist.indexOf(webPath) === -1) {
			//TODO log invalid request
			console.error('invalid request: ' + webPath);
			send404(response);
			return;
		}
		var handler = handlers[webPath];
		try {
			handler.onRequest(request, response);
		} catch(e) {
			//TODO log handler error
			logError(e);
			send503(response);
		}
	});
	app.listen(PORT);
// }
function logError(error) {
	console.error("ERROR " + JSON.stringify(error));
	console.error(error.stack);
	console.trace();
	console.error("/ERROR " + JSON.stringify(error));
}
function send404(response) {
	response.status(404).send('404 - Not found');
	response.end();
}
function send503(response) {
	response.status(503).send('503 - Interal Server Error');
	response.end();
}
console.log('Server running on port ' + PORT);