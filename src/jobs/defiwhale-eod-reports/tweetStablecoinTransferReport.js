'use strict';

const {
  formatAmount,
  getLatestItem,
  sendTweetMessage } = require('./utils');

function createMessageForStablecoinReport(reportData, currencies=['DAI', 'MKR', 'USDC']) {
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  let message = '🏄‍♂️🤙 24hr Stablecoin Transfer Report:\n\n'
  currencies.forEach((c, i) => {
    let _ = reportData[c]
    let nextText = `$${_.tokenSymbol}: $${usdformatter.format(_.amountUsd)}` +
      ` via ${formatAmount(_.numberOfTransactions)} txs\n`

    message += nextText
  })

  message += `\n#DeFi`

  return message
}

module.exports.start = async (reportData={}) => {
  // Get latest report from DynamoDB
  reportData = await getLatestItem('DAILY_TRANSFER_SUMMARY')

  // console.log(reportData)

  if(reportData && reportData.data) {
    // Create tweet message
    const stableCurrencies = ['DAI', 'USDC', 'USDT', 'PAX', 'TUSD']
    let tweet = createMessageForStablecoinReport(reportData.data, stableCurrencies)

    console.log(tweet)

    // Send message to lambda function to tweet
    let response = await sendTweetMessage({message: tweet})
    return response
  }

  return null
}

