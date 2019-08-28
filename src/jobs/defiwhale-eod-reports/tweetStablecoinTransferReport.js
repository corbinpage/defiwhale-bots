'use strict';

const { start: createChartImage } = require('./createChartImage.js')
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

function orderReportByVolume(reportData, currencies=['DAI', 'MKR', 'USDC']) {
  currencies.sort((a,b) => (
    reportData[a].amountUsd < reportData[b].amountUsd) ? 1 :
      ((reportData[b].amountUsd < reportData[a].amountUsd) ? -1 : 0)
  ); 

  return currencies
}

module.exports.start = async (reportData={}) => {
  // Get latest report from DynamoDB
  reportData = await getLatestItem('DAILY_TRANSFER_SUMMARY')

  console.log(reportData)

  if(reportData && reportData.data) {
    // Create tweet message
    const stableCurrencies = orderReportByVolume(
      reportData.data,
      ['DAI', 'USDC', 'USDT', 'PAX', 'TUSD']
    )
    const amountUsdArray = stableCurrencies.map((c, i) => {
      return reportData.data[c].amountUsd
    })

    let chartImageBinary = await createChartImage(stableCurrencies, amountUsdArray)
    let tweet = createMessageForStablecoinReport(reportData.data, stableCurrencies)

    console.log(tweet)

    // Send message to lambda function to tweet
    // if(chartImageBinary) {
    //   let response = await sendTweetMessage({
    //     message: tweet,
    //     media: [].push(chartImageBinary)
    //   })
    //   return response
    // } else {
    //   let response = await sendTweetMessage({message: tweet})
    //   return response
    // }
  }

  return null
}

