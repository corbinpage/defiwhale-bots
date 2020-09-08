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
    	  lendingProtocolMarkets(
    	    first: 100
    	    filter: {
    	      id: {
    	        in: ["aave/v1/dai", "compound/v2/dai", "dydx/v1/dai"]
    	      }
    	    }
    	  ) {
    	    id
    	    metricsBorrow(aggregationWindow: _1_DAY, first: 1, offset: 1) {
    	      borrowVolumeInUsd
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
  let message = '💰🏦 24hr Dai Loan Origination Volume:\n\n'

  let lendingRates = report.lendingProtocolMarkets.sort((a, b) => {
    return b.metricsBorrow[0].borrowVolumeInUsd - a.metricsBorrow[0].borrowVolumeInUsd
  })

  for(let i = 0; i < lendingRates.length; i++) {
    let _ = lendingRates[i]
    let name = _.id === 'aave/v1/dai' ? 'Aave' :
      _.id === 'dydx/v1/dai' ? 'dydx' :
      _.id === 'compound/v2/dai' ? 'Compound' :
      _.id === 'ddex/v1/dai' ? 'DDex' : ''

    let nextText = `${name}: ${n(_.metricsBorrow[0].borrowVolumeInUsd).format('($0.00a)')}\n`

    message += nextText
  }

  message += `\n#DeFi`

  return message
}

module.exports.saveBorrowDai24hrReport = async (event) => {
  let report = await getReport()

  console.log(JSON.stringify(report))

  if(report) {
    // Write report to DynamoDB
    let res = await putReport(report)
  }

  return report
}

module.exports.tweetBorrowDai24hrReport = async (report) => {
  let tweet

  if(report && report.data) {
    tweet = await createTweet(report.data)

    console.log(tweet)

    // let response = await sendTweetMessage({message: tweet})
  }

  return tweet
}



