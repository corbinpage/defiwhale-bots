'use strict';

const {
  getPriceFromSymbol,
  getExchangeAddressForSymbol,
  getLatestItem,
  sendTweetMessage } = require('./utils');

async function createMessageForUniswapReport(reportData, currencies=['DAI', 'MKR', 'USDC', 'BAT', 'WBTC']) {
  let reportRecords = reportData.data.exchangeDayDatas
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  const ethPrice = await getPriceFromSymbol('ETH')
  let message = '🦄💱 24hr Uniswap Report:\n\n'
  message += '--Daily Volume / Pool Size--\n'

  currencies.forEach((c, i) => {
    const exchangeAddress = getExchangeAddressForSymbol(c)

    const record = reportRecords.filter(r => {
      return r.exchangeAddress.toUpperCase() === exchangeAddress.toUpperCase()
    })

    if(record && record[0]) {
      let _ = record[0]
      _.ethVolumeUsd = _.ethVolume * ethPrice
      _.poolSize = _.tokenBalance * _.tokenPriceUSD

      let nextText = `$${c}: $${usdformatter.format(_.ethVolumeUsd)} ` +
        `/ $${usdformatter.format(_.poolSize)}\n`

      message += nextText
    }
  })

  message += `\n#DeFi`

  return message
}

module.exports.start = async (reportData={}) => {
  // Get latest report from DynamoDB
  reportData = await getLatestItem('DAILY_UNISWAP_SUMMARY')

  console.log(reportData)

   // Create tweet message
  if(reportData && reportData.data.exchangeDayDatas) {
    const uniswapCurrencies = ['DAI', 'MKR', 'USDC', 'BAT', 'WBTC']
    let tweet = await createMessageForUniswapReport(reportData, uniswapCurrencies)
 
    // console.log(reportData)
    console.log(tweet)

    // Send message to lambda function to tweet
    // let response = await sendTweetMessage({message: tweet})
    // return response
  }

  return null
}
