'use strict';

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


module.exports.start3 = async (event) => {
  let stablecoinTweet = await tweetStablecoinTransferReport()
  // let uniswapTweet = await tweetUniswapReport()

  return null
}

module.exports.start = async (event) => {
  // let stablecoinReport = await saveStablecoinTransferReport()
  // let uniswapReport = await saveUniswapReport()

  let success = !!(stablecoinReport && uniswapReport)
  console.log(`Status: ${success ? 'Success' : 'Failure'}`)

  let stablecoinTweet = await tweetStablecoinTransferReport()
  let uniswapTweet = await tweetUniswapReport()

  // return success
}

