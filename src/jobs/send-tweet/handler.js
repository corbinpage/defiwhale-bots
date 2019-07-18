'use strict';
const Botani = require('/opt/nodejs/botani')
const Twit = require("twit");
const Mustache = require("mustache");

function createMessage(message, params) {
	return Mustache.render(message, params);
}

async function sendMessage(message) {
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
	botani.startTask()
	const sendMessage = false
	let message = ''



	if(botani.params.tokenSymbol === 'DAI' && botani.params.amount >= 10000) {
		sendMessage = true
	} else if(botani.params.tokenSymbol === 'MKR' && botani.params.amount >= 20) {
		sendMessage = true
	}

	if(sendMessage) {
		message = createMessage(
			botani.flowModel[botani.taskId]["inputs"]["tweetMessage"],
			botani.params
		)
		console.log(message)
		let response = await sendMessage(message)
	}

	Object.assign(botani.params, {tweetSent: sendMessage, tweetMessage: message});

	return await botani.finishTask()
};
