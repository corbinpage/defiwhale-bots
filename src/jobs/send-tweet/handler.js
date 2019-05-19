'use strict';
const Botani = require('/opt/nodejs/botani')
const Twit = require("twit");
const Mustache = require("mustache");

function createMessage(message, params) {
	return Mustache.render(message, params);
}

module.exports.start = async (event) => {
	const botani = new Botani(event, {trigger: "Sns"})
	botani.startTask()

	var T = new Twit({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token: process.env.TWITTER_ACCESS_TOKEN,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	})

	let message = createMessage(botani.flowModel[botani.taskId]["inputs"]["tweetMessage"], botani.params)

	console.log(message)
	// let response = await T.post('statuses/update', { status: message })
	Object.assign(botani.params, {tweetSent: true, tweetMessage: message});

	return await botani.finishTask()
};
