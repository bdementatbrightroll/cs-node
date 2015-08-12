var util = require('util');
var locations = require('./locations.json'); // MUST CONTAIN latitude, longitude fields
var maxmind = require('maxmind');
maxmind.init('/usr/local/share/GeoIP/GeoIPCity.dat');

// const TEST_IP = '76.245.7.147'; // Illinois,
// const TEST_IP = '71.10.122.95'; // Wisconsin,
// const TEST_IP = '129.186.8.0'; // Iowa,
const TEST_IP = '136.181.146.0'; // Michigan

module.exports.onRequest = function(request, response) {
	var ip = getIP(request);
	console.log("[CULVERS] ip: " + ip);
	if (!ip) {
		throw new Error("Couldn't determine ip! (" + ip + ")");
	}
	var customerLocation = maxmind.getLocation(ip);
	console.log("[CULVERS] customerLocation: " + util.inspect(customerLocation));
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
	console.log("[CULVERS] closestLocation: " + util.inspect(closestLocation));
	if (closestLocation) {

		var template =	"<location>\n" +
						"	<Address><![CDATA[${Address}]]></Address>\n" +
						"	<City><![CDATA[${City}]]></City>\n" +
						"	<State><![CDATA[${State}]]></State>\n" +
						"	<Postal><![CDATA[${Postal}]]></Postal>\n" +
						"	<Phone><![CDATA[${Phone}]]></Phone>\n" +
						"	<Url><![CDATA[${Url}]]></Url>\n" +
						"</location>";

		var xml = template 	.replace("${Address}", closestLocation.Address)
							.replace("${City}", closestLocation.City)
							.replace("${State}", closestLocation.State)
							.replace("${Postal}", closestLocation.Postal)
							.replace("${Phone}", closestLocation.Phone)
							.replace("${Url}", closestLocation.Url);

		response.write(xml);
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