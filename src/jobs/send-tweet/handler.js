'use strict';
const Botani = require('/opt/nodejs/botani')
const Twit = require("twit");
const Mustache = require("mustache");

function createMessage(params) {
	const tweet =  'Ahoy! {{amount}} {{tokenSymbol}} transfer spotted!\n\nhttps://etherscan.io/tx/{{transactionHash}}'
	params.amount = params.amount.toLocaleString()
	return Mustache.render(tweet, params);
}

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
	const botani = new Botani(event, {trigger: "Sns"})
	// botani.startTask()
	let confirmSendMessage = false
	let message = ''

	if(botani.params.tokenSymbol === 'DAI' && botani.params.amount >= 100000) {
		confirmSendMessage = true
	} else if(botani.params.tokenSymbol === 'USDC' && botani.params.amount >= 50000) {
		confirmSendMessage = true
	} else if(botani.params.tokenSymbol === 'MKR' && botani.params.amount >= 20) {
		confirmSendMessage = true
	}

	if(confirmSendMessage) {
		console.log('Preparing the tweet...')
		message = createMessage(
			botani.params
		)
		console.log(message)
		let response = await sendTweet(message)
	}

	Object.assign(botani.params, {tweetSent: confirmSendMessage, tweetMessage: message});

	return botani
};
