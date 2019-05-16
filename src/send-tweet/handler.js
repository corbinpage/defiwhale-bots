'use strict';
require('dotenv').config()
const Twit = require("twit");

module.exports.start = async (event) => {
	let output = JSON.parse(JSON.stringify(event))

	var T = new Twit({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token: process.env.TWITTER_ACCESS_TOKEN,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	})

	// let response = await T.post('statuses/update', { status: 'Testing, testing, 1, 2, 3!' })
	let response = "temp"
	console.log('Tweet Sent!')
	Object.assign(output.params, {tweetSent: true});

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: output,
      input: event,
    }, null, 2),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
