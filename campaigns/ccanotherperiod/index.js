var redis = require("redis"),
client = redis.createClient();

module.exports.onRequest = function(req, res) {
	client.incr('cc_aanother_period_count', function(error, result) {
		res.status(200).send(JSON.stringify(result));
	});
}
