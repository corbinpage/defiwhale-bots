'use strict';

const {
  getPriceFromSymbol,
  getExchangeAddressForSymbol,
  getReportSummaryForDay,
  sendTweetMessage } = require('./utils');

async function createMessageForUniswapReport(reportData, currencies=['DAI', 'MKR', 'USDC', 'BAT', 'WBTC']) {
  let reportRecords = reportData.data.exchangeDayDatas
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  let message = '🦄💱 24hr Uniswap Report:\n\n'
  message += '--Daily Volume / Pool Size--\n'

  reportRecords.forEach((record, i) => {
    let poolSize = record.poolSize !== 0 ? record.poolSize : record.poolSizeTkn
    let nextText = `$${record.tokenSymbol}: $${usdformatter.format(record.ethVolumeUsd)} ` +
      `/ $${usdformatter.format(poolSize)}\n`

    message += nextText
  })

  message += `\n#DeFi`

  return message
}

module.exports.start = async (send=false) => {
  // Get latest report from DynamoDB
  let reportData = await getReportSummaryForDay('DAILY_UNISWAP_VOLUME_SUMMARY', new Date())

  // console.log(reportData.data.exchangeDayDatas)

   // Create tweet message
  if(reportData && reportData.data.exchangeDayDatas) {
    const uniswapCurrencies = ['DAI', 'MKR', 'USDC', 'BAT', 'WBTC', 'SNX']
    let tweet = await createMessageForUniswapReport(reportData, uniswapCurrencies)
 
    console.log(tweet)

    // Send message to lambda function to tweet
    if(send) {
      let response = await sendTweetMessage({message: tweet})
      return response      
    }
  }

  return null
}
