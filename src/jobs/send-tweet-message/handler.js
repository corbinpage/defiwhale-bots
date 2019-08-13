'use strict';

const { getMessageFromSNS } = require('./utils');

const Twit = require('twit');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

async function sendTweet(message) {
	var T = new Twit({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token: process.env.TWITTER_ACCESS_TOKEN,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	})

	return T.post('statuses/update', { status: message })
}

module.exports.start = async (event) => {
	let params = getMessageFromSNS(event).params
	let response

	if(params.message) {
		response = await sendTweet(message)
	}

	return response
};