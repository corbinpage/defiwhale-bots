'use strict';

const axios = require('axios')
const {
  sendTweetMessage,
  } = require('./utils');
const alerts = require('google-alerts-api')

// async function getTokenTransfersFromAlethio(tokenAddress, inputUrl='') {
// 	const base = 'https://api.aleth.io/'
// 	const version = 'v1'
//   const limit = '100'
// 	const path = `/tokens/${tokenAddress}/tokenTransfers?page[limit]=${limit}`
//   const url = inputUrl ? encodeURI(inputUrl) : `${base}${version}${path}`

//   const auth = {
//     username: process.env.ALETHIO_API_KEY,
//     password: ''
//   }

// 	let headers = {
//   	'Accept': 'application/json'
//   }

// 	let params = {}

// 	try {
//     const response = await axios({
// 		  method: 'get',
//       auth: auth,
// 		  url: url,
// 		  headers: headers,
// 		  params: params
// 		})

//     // console.log(response)
//     // console.log('-------')
//     // console.log(response.data)

//     return response.data
//   } catch (error) {
//     console.error(error)
//     return {}
//   }
// }

  function printAlertInfo(alert) {
    console.log('name:', alert.name);
    //'How Many' property information:
    if (alert.howMany === HOW_MANY.BEST) {
      console.log('How many: Only the best results');
    } else if (alert.howMany === HOW_MANY.ALL) {
      console.log('How many: All Results');
    }
  }

async function getTickerNews(tickers) {
  const { HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE } = alerts;

  return 'Testing, testing 123'

  try {
    alerts.configure({
        mail: 'your_mail@gmail.com',
        password: '**********'
    });

    return alerts.sync((err) => {
      if(err) return console.log(err);
      return alerts.getAlerts();
    });

  } catch (error) {
    console.error(error);
    return {error}
  }
}

async function createMessageForRoboSurgeryTweet(newsData) {

  return 'Testing, testing 123'
}

module.exports.start = async (event) => {
  const tickers = ['ISRG']

  const newsResults = await getTickerNews(tickers)

  console.log(newsResults)

  if(false && newsResults) {
    const tweet = await createMessageForRoboSurgeryTweet()

    console.log(tweet)

    let response = await sendTweetMessage({
      status: tweet
    })
    return response
  }

  return null    
}