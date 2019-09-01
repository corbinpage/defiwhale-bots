'use strict';

const axios = require('axios')
const {
  sendTweetMessage,
  } = require('./utils');
const alerts = require('google-alerts-api')
let Parser = require('rss-parser');

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

async function getGoogleAlerts() {
  const { HOW_OFTEN, DELIVER_TO, HOW_MANY, SOURCE_TYPE } = alerts;

  try {
    const SID = process.env.GOOGLE_ALERTS_SID
    const HSID = process.env.GOOGLE_ALERTS_HSID
    const SSID = process.env.GOOGLE_ALERTS_SSID

    alerts.configure({
        cookies: alerts.generateCookiesBySID(SID, HSID, SSID).toString()
    });

    return new Promise((resolve, reject) => {
      alerts.sync((err) => {
          if(err) reject(new Error(err))

          resolve(alerts.getAlerts())
        });            
      })

  } catch (error) {
    console.error(error);
    return {error}
  }
}

async function createMessageForRoboSurgeryTweet(newObj) {
  console.log(newObj)

  let message = `${newObj.title}\n\n${newObj.link}`

  return message
}

async function parseRssFeed(url) {
  let parser = new Parser();
  let feed = await parser.parseURL(url);

  return feed.items
}

module.exports.start = async (event) => {

  const newsResults = await getGoogleAlerts()
  const newsObjects = await parseRssFeed(newsResults[0]['rss'])

  // console.log(newsResults)

  if(newsObjects && newsObjects[0]) {
    const tweet = await createMessageForRoboSurgeryTweet(newsObjects[0])

    console.log(tweet)

    let response = await sendTweetMessage({
      status: tweet
    })
    return response
  }

  return null    
}