'use strict';

const Twitter = require('twitter');
let express = require('express');
let app = express();
app.set('view engine', 'pug');

exports.postTweet = function(req, res, tweetbody) {
	let twitter = new Twitter({
		consumer_key: 'UcPcus74KgmuMyYefE6BVrVJ7',
		consumer_secret: 'w7ezUqvRuknLhJtnET7nfXkLXxzsUy4geYWb3EUVKc2XGiEEnJ',
		access_token_key: '1122334771022127105-0nQzvGQG5VFBY3jl1z5MiRcbCSUnOm',
		access_token_secret: 'Fkly6sbSnXSBiSiMXZ3XwqO8VZatqVlXxw5hycBW5S8rk'
	});
	twitter.post('statuses/update', {status: tweetbody})
		.then(function (tweet) {
			console.log(tweet);
		})
		.catch(function (error) {
			console.log(error);
		});
};