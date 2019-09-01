'use strict';

const axios = require('axios')
const {
  sendTweetMessage,
  } = require('./utils');
const alerts = require('google-alerts-api')
let Parser = require('rss-parser');

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

  console.log(newsObjects)

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