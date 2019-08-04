'use strict';
const Botani = require('/opt/nodejs/botani')
const Twit = require("twit");
const Mustache = require("mustache");
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function createMessage(params) {
	const tweet =  'Ahoy! {{amount}} {{tokenSymbol}} (${{amountUsd}}) transfer spotted!\n\nhttps://etherscan.io/tx/{{transactionHash}}'
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

async function getPrices(limit=10) {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: 'BOTANI_PRICES',
    Limit: limit
  }

  try {
    const response = await dynamoDb.scan(params).promise()

		return response.Items[0]['data']
	} catch (error) {
	  console.error(error);
	  return {}
	}
}

async function getPriceFromSymbol(symbol='DAI') {
	const prices = await getPrices()
	let price = 0

	try {
		price = prices[symbol]['quote']['USD']['price'] || 0
		price = price.toFixed(2)
	} catch(error) {
		console.error(error)
	}

	return price
}

function isImportantTransfer(params) {
	let confirmSendMessage = false

	// Based on USD amoount transferred
	// if(tokenSymbol === 'DAI' && amountUsd >= 100000) {
	if(params.tokenSymbol === 'DAI' && params.amountUsd >= 1) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'USDC' && params.amountUsd >= 50000) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'MKR' && params.amountUsd >= 20000) {
		confirmSendMessage = true
	}

	// Based on tokens transferred
	// if(params.tokenSymbol === 'DAI' && params.amount >= 100000) {
	// 	confirmSendMessage = true
	// } else if(params.tokenSymbol === 'USDC' && params.amount >= 50000) {
	// 	confirmSendMessage = true
	// } else if(params.tokenSymbol === 'MKR' && params.amount >= 20) {
	// 	confirmSendMessage = true
	// }

	console.log(`${params.amount} ${params.tokenSymbol} @ $${params.price} USD/${params.tokenSymbol}`)
	console.log(`Total $${params.amountUsd} - ${confirmSendMessage ? 'Send Tweet' : 'No Tweet'}`)

	return confirmSendMessage
}


module.exports.start = async (event) => {
	const botani = new Botani(event, {trigger: "Sns"})
	// botani.startTask()
	let confirmSendMessage = false
	let message = ''

	botani['params']['price'] = await getPriceFromSymbol(
		botani['params']['tokenSymbol']
	)
	botani['params']['amountUsd'] = botani['params']['price'] * botani['params']['amount']
	botani['params']['amountUsd'] = botani['params']['amountUsd'].toFixed(2)

	confirmSendMessage = isImportantTransfer(botani.params)

	if(confirmSendMessage) {
		console.log('Preparing the tweet...')
		message = createMessage(
			botani.params
		)
		console.log(message)
		// let response = await sendTweet(message)
	}

	Object.assign(botani.params, {tweetSent: confirmSendMessage, tweetMessage: message});

	return botani
};
