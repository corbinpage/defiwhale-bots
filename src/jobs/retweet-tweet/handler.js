'use strict';
const Botani = require('/opt/nodejs/botani')
const Twit = require("twit");
const Mustache = require("mustache");

function createMessage(params) {
	const tweet =  'Ahoy! {{amount}} {{tokenSymbol}} transfer spotted!\n\nhttps://etherscan.io/tx/{{transactionHash}}'
	params.amount = params.amount.toLocaleString()
	return Mustache.render(tweet, params);
}

async function sendTweet(id_str) {
	var T = new Twit({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token: process.env.TWITTER_ACCESS_TOKEN,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	})

	return T.post('statuses/retweet/:id', { id: id_str })
}

module.exports.start = async (event) => {
	const botani = new Botani(event, {trigger: "Sns"})

	let response = await sendTweet(botani.params.tweet.id_str)

	Object.assign(botani.params, {tweetSent: true, tweetMessage: botani.params.tweet.text});

	return botani
};
