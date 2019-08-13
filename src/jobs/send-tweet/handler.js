'use strict';

const { getMessageFromSNS, getPriceFromSymbol } = require('./utils');

const Twit = require('twit');
const Mustache = require('mustache');

function createMessage(params) {
	var usNumberFormatter = new Intl.NumberFormat('en-US');
	var usdformatter = new Intl.NumberFormat('en-US', {
	  style: 'currency',
	  currency: 'USD',
	});

	const tweet =  'Ahoy! {{amount}} {{tokenSymbol}} ({{amountUsd}}) transfer spotted!\n\n#DeFi #{{tokenSymbol}}\nhttps://etherscan.io/tx/{{transactionHash}}'
	params.amount = usNumberFormatter.format(params.amount.toFixed(2))
	params.amountUsd = usdformatter.format(params.amountUsd)

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

function isImportantTransfer(params) {
	let confirmSendMessage = false

	// Based on USD amoount transferred
	if(params.tokenSymbol === 'DAI' && params.amountUsd >= 100000) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'USDC' && params.amountUsd >= 500000) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'MKR' && params.amountUsd >= 20000) {
		confirmSendMessage = true
	}

	console.log(`Send ${params.amount} ${params.tokenSymbol} ($${params.amountUsd}): ${confirmSendMessage}`)

	return confirmSendMessage
}


module.exports.start = async (event) => {
	let confirmSendMessage = false
	let message = ''

	let params = getMessageFromSNS(event).params

	params.price = await getPriceFromSymbol(
		params.tokenSymbol
	)
	params.amountUsd = params.price * params.amount

	confirmSendMessage = isImportantTransfer(params)

	if(confirmSendMessage) {
		message = createMessage(
			params
		)

		console.log(`${params.amount} ${params.tokenSymbol} @ $${params.price} USD/${params.tokenSymbol}`)
		console.log(`Total ${params.amountUsd} - ${confirmSendMessage ? 'Send Tweet' : 'No Tweet'}`)
		console.log('Preparing the tweet...')
		console.log(message)

		let response = await sendTweet(message)
	}

	Object.assign(params, {tweetSent: confirmSendMessage, tweetMessage: message});

	return params
};



// Test
// serverless invoke local -f start --data '{ "Records": [ {"Sns": { "Message": { "params": { "amount": 100000.111, "tokenSymbol": "DAI", "transactionHash": "0xaaf556bc547d7e7ff9e70c0fbb1b787929445fd9c7aa09298c7f30af7c1f8bc8" }, "flowModel": [ { "taskType": "whale-token-transfer-tweet", "inputs": [] } ], "taskHistory": [] } } } ] }'
