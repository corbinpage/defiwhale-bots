'use strict';

const axios = require('axios')
const $ = require('cheerio')
const n = require('numeral')
const AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

const {
  formatAmount,
  getDayId,
  sendTweetMessage
  } = require('./utils');

async function getAuthToken() {
  let response

  try {
    response = await axios({
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      url: 'https://codefi-prod.eu.auth0.com/oauth/token',
      data: `audience=https://api.codefi.network&grant_type=client_credentials&client_id=${process.env.CODEFI_CLIENT_ID}&client_secret=${process.env.CODEFI_CLIENT_SECRET}`
    })    
  } catch(e) {
    console.error(e)
  }

  return response.data.access_token
}

async function getReport() {
  let response
  const authToken = await getAuthToken()

  const query = JSON.stringify({
    query: `
      {
        lendingProtocolMarkets(first: 100, filter: {id: {in: ["aave/v1/dai","compound/v2/dai","ddex/v1/dai","dydx/v1/dai",]}}) {
          id
          metricsState(first: 1, aggregationWindow: _15_MIN) {
            debtAssetAprAvg
            debtAmountInUsdAvg
            supplyAmountInUsdAvg
            supplyAssetAprAvg
          }
        }
      }
      `
    })

  try {
    response = await axios({
      method: 'POST',
	    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      url: 'https://api.data.codefi.network/defi/v1/graphql',
      data: query
    })    
  } catch(e) {
    console.error(e)
  }

  return response.data
}

async function putReport(params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const dateTime = parseInt((new Date().getTime() / 1000).toFixed(0))
  const dayId = await getDayId()

  const record = {
    TableName: 'DAILY_LENDING_REPORT',
    Item: {
      dayId: dayId,
      daiRateData: params,
      createdAt: dateTime,
      updatedAt: dateTime
    },
  }

  try {
    const response = await dynamoDb.put(record).promise();

    return response
  } catch (e) {
    console.error(e)
  }
};

function createTweet(report) {
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  });
  let message = '💰🏦 Dai Lending Rates (APR):\n\n'

  let lendingRates = report.lendingProtocolMarkets.sort((a, b) => {
    return b.metricsState[0].supplyAssetAprAvg - a.metricsState[0].supplyAssetAprAvg
  })

  for(let i = 0; i < lendingRates.length; i++) {
    let _ = lendingRates[i]
    let name = _.id === 'aave/v1/dai' ? 'Aave' :
      _.id === 'dydx/v1/dai' ? 'dydx' :
      _.id === 'compound/v2/dai' ? 'Compound' :
      _.id === 'ddex/v1/dai' ? 'DDex' : ''

    let nextText = `${name}: ${usdformatter.format(100*_.metricsState[0].supplyAssetAprAvg)}%\n`

    message += nextText
  }

  message += `\n#DeFi`

  return message
}

module.exports.saveLendingRateReport = async (event) => {
  let report = await getReport()

  console.log(JSON.stringify(report))

  if(report) {
    // Write report to DynamoDB
    let res = await putReport(report)
  }

  return report
}


function createSupplyDebtTweet(report) {
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  let message = '💰🏦 Dai Lending Util% Supply Debt:\n\n'

  let reportSorted = report.lendingProtocolMarkets.sort((a, b) => {
    return b.metricsState[0].supplyAmountInUsdAvg - a.metricsState[0].supplyAmountInUsdAvg
  })

  for(let i = 0; i < reportSorted.length; i++) {
    let _ = reportSorted[i]
    let name = _.id === 'aave/v1/dai' ? 'Aave' :
      _.id === 'dydx/v1/dai' ? 'dydx' :
      _.id === 'compound/v2/dai' ? 'Compound' :
      _.id === 'ddex/v1/dai' ? 'DDex' : ''

    let nextText = `${name}: ${usdformatter.format(100*(_.metricsState[0].debtAmountInUsdAvg/_.metricsState[0].supplyAmountInUsdAvg))}% ${n(_.metricsState[0].supplyAmountInUsdAvg).format('($0.00a)')} ${n(_.metricsState[0].debtAmountInUsdAvg).format('($0.00a)')}\n`

    message += nextText
  }

  message += `\n#DeFi`

  return message
}

module.exports.tweetLendingRateReport = async (report) => {
  let tweet

  if(report && report.data) {
    tweet = await createTweet(report.data)
    let supplyDebtTweet = await createSupplyDebtTweet(report.data)

    console.log(tweet)
    console.log(supplyDebtTweet)

    // let response = await sendTweetMessage({message: tweet})
  }

  return tweet
}



