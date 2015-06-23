var dealers = require('./dealers.json');
var maxmind = require('maxmind');
maxmind.init('/usr/local/share/GeoIP/GeoIPCity.dat');

const TEST_IP = '162.208.23.98'; // SF
// const TEST_IP = '96.44.189.101'; // LA

module.exports.onRequest = function(request, response) {
	var ip = getIP(request);
	if (!ip) {
		throw new Error("Couldn't determine ip! (" + request.connection.remoteAddress + ")");
	}
	var customerLocation = maxmind.getLocation(ip);
	var closestDistance =  Number.MAX_VALUE;
	var closestDealer = null;
	for (var index in dealers) {
		var dealer = dealers[index];
		var distance = customerLocation.distance(dealer);
		dealer.distance = distance;
		if (distance < closestDistance) {
			closestDistance = distance;
			closestDealer = dealer;
		}
	}
	if (closestDealer) {
		response.write(JSON.stringify(closestDealer));
		response.end();	
	} else {
		throw new Error("Couldn't find a dealer! (" + request.connection.remoteAddress + ")");
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