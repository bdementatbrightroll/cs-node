var http = require('http');
var maxmind = require('maxmind');

maxmind.init('/usr/local/share/GeoIP/GeoIPCity.dat');

const API_HOST = 'query.yahooapis.com';
const API_PATH = '/v1/public/yql?q=[query]&format=json';
const YQL = 'select item.condition from weather.forecast where woeid in (select woeid from geo.places(1) where text="[city], [state]")';

// const TEST_IP = '162.208.23.98'; // SF
const TEST_IP = '96.44.189.101'; // LA

module.exports.onRequest = function(request, response) {
	var ip = getIP(request);
	if (!ip) {
		throw new Error("Couldn't determine ip! (" + request.connection.remoteAddress + ")");
	}
	var location = maxmind.getLocation(ip);
	var query = YQL.replace('[city]', location.city).replace('[state]', location.region);
	var options = {
		hostname: API_HOST,
		port: 80,
		path: encodeURI(API_PATH.replace('[query]', query)),
		method: 'GET'
	};
	var proxy = http.request(options, 
		function (proxy_response) {
			proxy_response.pipe(response, {
				end: true
			});
		});
	request.pipe(proxy, {
		end: true
	});
}

//TODO ip lib
function getIP(request) {
	var socket = request.connection;
	var family = socket.remoteFamily;
	var address = socket.remoteAddress;
	if (family == "IPv6") {
		return address != '::1' ? address : TEST_IP;
	} else if(family == "IPv4") {
		return address != '127.0.0.1' ? address : TEST_IP;
	}
	return null;
}