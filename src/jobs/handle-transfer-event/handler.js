'use strict';

const Mustache = require('mustache');
const {
  getMessageFromSNS,
  getPriceFromSymbol,
  getPriceFromSymbol2,
  formatAmount,
  getLatestTransferReport,
  sendTweetMessage } = require('./utils');


function createMessage(params) {
	const tweet =  'Ahoy! {{amount}} {{tokenSymbol}} ({{amountUsd}}) transfer spotted!\n\n#DeFi #{{tokenSymbol}}\nhttps://etherscan.io/tx/{{transactionHash}}'
	params.amount = formatAmount(params.amount)
	params.amountUsd = formatAmount(params.amountUsd, true)

	return Mustache.render(tweet, params);
}

function isImportantTransfer(params) {
	let confirmSendMessage = false
	let reportData = ((params || {}).report || {}).data || {}
	let daiMaxAmountUsd = (((reportData.DAI || {}).top10 || {}).attributes || {}).amountUsd || 100000
	let usdcMaxAmountUsd = (((reportData.USDC || {}).top10 || {}).attributes || {}).amountUsd || 500000
	let mkrMaxAmountUsd = (((reportData.MKR || {}).top10 || {}).attributes || {}).amountUsd || 20000

	// Based on USD amount transferred
	if(params.tokenSymbol === 'DAI' && params.amountUsd >= daiMaxAmountUsd) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'SAI' && params.amountUsd >= daiMaxAmountUsd) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'USDC' && params.amountUsd >= usdcMaxAmountUsd) {
		confirmSendMessage = true
	} else if(params.tokenSymbol === 'MKR' && params.amountUsd >= mkrMaxAmountUsd) {
		confirmSendMessage = true
	}

	console.log(`Send ${params.amount} ${params.tokenSymbol} ($${params.amountUsd}): ${confirmSendMessage}`)
	console.log(`Compared to: ${(params.tokenSymbol === 'DAI' || params.tokenSymbol === 'SAI') ? daiMaxAmountUsd
		: params.tokenSymbol === 'USDC' ? usdcMaxAmountUsd : mkrMaxAmountUsd}`)
	console.log(`Send Tweet: ${confirmSendMessage ? 'Yes' : 'No'}`)

	return confirmSendMessage
}


module.exports.start = async (event) => {
	let confirmSendMessage = false
	let message = ''

	let params = getMessageFromSNS(event)

	params.price = await getPriceFromSymbol(
		params.tokenSymbol
	)
	params.amountUsd = params.price * params.amount

	params.report = await getLatestTransferReport()
	params.confirmSendMessage = isImportantTransfer(params)
	console.log(params)

	if(params.confirmSendMessage) {
		message = createMessage(
			params
		)

		let response = await sendTweetMessage({message: message})
		return response
	}

	return {}
};



// Test
// serverless invoke local -f start --data '{ "Records": [ {"Sns": { "Message": {"amount": 100000.111, "tokenSymbol": "DAI", "transactionHash": "0xaaf556bc547d7e7ff9e70c0fbb1b787929445fd9c7aa09298c7f30af7c1f8bc8" } } } ] }'
