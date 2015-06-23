var locations = require('./locations.json'); // MUST CONTAIN latitude, longitude fields
var maxmind = require('maxmind');
maxmind.init('/usr/local/share/GeoIP/GeoIPCity.dat');

// const TEST_IP = '162.208.23.98'; // SF
const TEST_IP = '96.44.189.101'; // LA

module.exports.onRequest = function(request, response) {
	var ip = getIP(request);
	if (!ip) {
		throw new Error("Couldn't determine ip! (" + ip + ")");
	}
	var customerLocation = maxmind.getLocation(ip);
	var closestDistance =  Number.MAX_VALUE;
	var closestLocation = null;
	for (var index in locations) {
		var location = locations[index];
		var distance = customerLocation.distance(location);
		location.distance = distance;
		if (distance < closestDistance) {
			closestDistance = distance;
			closestLocation = location;
		}
	}
	if (closestLocation) {
		response.write(JSON.stringify(closestLocation));
		response.end();	
	} else {
		throw new Error("Couldn't find a location! (" + ip + ")");
	}
}
function getIP(request) {
	var socket = request.connection;
	var family = socket.remoteFamily;
	var address = socket.remoteAddress;
	if (family == "IPv6") {
		return address != '::1' ? address : TEST_IP;
	} else if(family == "IPv4") {
		return address != '127.0.0.1' ? address : TEST_IP;
	}
	return address;
}