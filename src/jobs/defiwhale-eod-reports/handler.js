'use strict';

const {
  saveTLVReport,
  tweetTLVReport,
} = require('./tlvReport');
const {
  saveLendingRateReport,
  tweetLendingRateReport,
} = require('./lendingRateReport');

async function saveStablecoinTransferReport() {
  const {
    start
  } = require('./saveStablecoinTransferReport');

  const reportData = await start()

  return reportData
}

async function saveUniswapReport() {
  const {
    start
  } = require('./saveUniswapReport');

  const reportData = await start()

  return reportData
}

async function tweetStablecoinTransferReport() {
  const {
    start
  } = require('./tweetStablecoinTransferReport');

  const tweetResponse = await start()

  return tweetResponse
}

async function tweetUniswapReport() {
  const {
    start
  } = require('./tweetUniswapReport');

  const tweetResponse = await start()

  return tweetResponse
}

module.exports.start = async (event) => {
  let defiTlvReport = await saveTLVReport()
  let tweet = await tweetTLVReport(defiTlvReport)

  let lendingRatereport = await saveLendingRateReport()
  let tweet2 = await tweetLendingRateReport(lendingRatereport)


  // let stablecoinReport = await saveStablecoinTransferReport()
  // let stablecoinTweet = await tweetStablecoinTransferReport({send: false})
  
  // let uniswapReport = await saveUniswapReport()
  // let uniswapTweet = await tweetUniswapReport({send: false})
}

