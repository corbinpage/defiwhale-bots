'use strict';

const axios = require('axios')
const $ = require('cheerio')
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const {
  formatAmount,
  getDayId,
  sendTweetMessage
  } = require('./utils');


async function getTVLReport() {
  let response

  try {
    response = await axios({
      method: 'get',
      url: 'https://defipulse.com/',
    })    
  } catch(e) {
    console.error(e)
  }

  return JSON.parse($('#__NEXT_DATA__', response.data).html())
}


async function putReport(params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const dateTime = parseInt((new Date().getTime() / 1000).toFixed(0))
  const dayId = await getDayId()

  const record = {
    TableName: 'DAILY_TLV_REPORT',
    Item: {
      dayId: dayId,
      data: params,
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

function createTweet(defiTlvReport) {
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  let message = '💰🛁 Largest DeFi Pools:\n\n'

  for(let i = 0; i < 5; i++) {
    let _ = defiTlvReport[i]
    let nextText = `${_.name}: $${usdformatter.format(_.value.tvl.USD.value)}\n`

    message += nextText
  }

  message += `\n#DeFi`

  return message
}

module.exports.saveTLVReport = async (event) => {
  let defiTlvData = await getTVLReport()
  let defiTlvReport = defiTlvData["props"]["initialState"]["coin"]["projects"] || []

  console.log(defiTlvReport)

  if(defiTlvReport && defiTlvReport.length) {
    // Write report to DynamoDB
    let res = await putReport(defiTlvReport)
  }

  return defiTlvReport
}

module.exports.tweetTLVReport = async (defiTlvReport) => {
  let tweet

  if(defiTlvReport && defiTlvReport.length) {
    tweet = await createTweet(defiTlvReport)

    console.log(tweet)

    let response = await sendTweetMessage({message: tweet})
  }

  return tweet
}



