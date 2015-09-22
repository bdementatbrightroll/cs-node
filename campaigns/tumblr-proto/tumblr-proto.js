// Authenticate via OAuth
var tumblr = require('tumblr.js');
var util = require('util');
var jsdom = require("jsdom");

var client = tumblr.createClient({
	consumer_key: 'Tpmy5chnqhEHpiiyhZjAHwJdknfI9gdwdUrqTSEG30GwcvneN8',
	consumer_secret: 'eL2zukRVT9vt84EiJygPPjuYNEhGAuWpdu6RqQCSAOdW54YSDU',
	token: 'GKk5xX8bYPhJZzrX6a6p9jQJpCISW8NtHyn6kEebo21a01FU9o',
	token_secret: '3ulqcJVWdoShaU4AncPMd1LCoIUR467U4Ol4FJrNrAedx88yPX'
});

module.exports.onRequest = function(request, response) {
	client.posts('bdementatyahoo', {type:'video'}, function(err, data) {
		//TODO: Handle multiple posts
		data.posts.map( function(post) {
			var playerInfo = post.player.filter(function(playerInfo) {
				// console.log("playerInfo.embed_code: " + playerInfo.embed_code);
				return playerInfo.width == 250;
			});
			jsdom.env(
				playerInfo[0].embed_code,
				["https://code.jquery.com/jquery.js"],
				function (err, window) {
					var src = window.$("source")[0].getAttribute("src");
					response.write(src.replace("http:", "https:"));
					response.end();
				}
			);
		});
	});
}