'use strict';

const { getMessageFromSNS } = require('./utils');

const Twit = require('twit');
const AWS = require('aws-sdk');
const request = require('request');
const m = require('moment');

AWS.config.update({region: 'us-east-1'});
const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

async function getTweetMentions() {
  return T.get('statuses/mentions_timeline')
}

async function getOriginalTweets(mentionedTweets) {
  let originalTweets = []
  let response = {}

  for(let i = 0; i < mentionedTweets.length; i++) {
    try {
      response = await T.get('statuses/show/:id', {
        id: mentionedTweets[i].in_reply_to_status_id_str
      })

      if(response) {
        response.data.replyTweet = mentionedTweets[i]
        originalTweets.push(response.data)
        response = {}
      }

    } catch (e) {
      console.error(e)
    }
  }

  return originalTweets
}

async function filterProcessedTweets(tweets) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  let newTweets = []
  let params = {}
  let result = {}

  for(let i = 0; i < tweets.data.length; i++) {
    // Search Dynamo
    params = {
      TableName: 'RECORD_TWEETS',
      Key: {
        tweetId: tweets.data[i].in_reply_to_status_id_str,
      }
    }

    try {
      result = await dynamoDb.get(params).promise()

      if (!result.Item) {
        newTweets.push(tweets.data[i])
        result = {}
      }
    } catch (e) {
      console.error(e)
    }
  }

  return newTweets
}

async function saveTweet(tweet) {
  await saveToDynamo(tweet)
  let res = await saveToIPFS(tweet)

  return res["Hash"]
}

async function saveToIPFS(tweet) {
  const util = require('util')
  const asyncRequest = util.promisify(request.post);
  let response = {}

  let url = 'https://ipfs.infura.io:5001/api/v0/add?pin=false'
  const formData = {
    data: JSON.stringify(tweet)
  };

  try {
    let temp = await asyncRequest({
      url: url,
      formData: formData
    })

    response = (temp && temp.body) ? JSON.parse(temp.body) : {}
  } catch (e) {
    console.error(e)
  }

  return response
}

async function saveToDynamo(tweet) {
  await saveTweetToDynamo(tweet)
  await saveTagToDynamo(tweet)
}

async function saveTagToDynamo(tweet) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const record = {
    TableName: 'RECORD_TAGS',
    Item: {
      tagId: 'All',
      tweetTime: (new Date(tweet.created_at)).toISOString(),
      tweetId_str: tweet.id_str
    },
  }

  try {
    const response = await dynamoDb.put(record).promise();
    return response
  } catch (error) {
    console.error(error);
    return {error}
  }
}

async function saveTweetToDynamo(tweet) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const record = {
    TableName: 'RECORD_TWEETS',
    Item: {
      tweetId: tweet.id_str,
      data: JSON.stringify(tweet)
    },
  }

  try {
    const response = await dynamoDb.put(record).promise();
    return response
  } catch (error) {
    console.error(error);
    return {error}
  }
}

async function replyToMention(tweet, ipfsHash) {
  let message = `Got it @${tweet.replyTweet.user.screen_name}! 👌

@${tweet.user.screen_name}'s tweet has been saved forever in IPFS. 

https://ipfs.io/ipfs/${ipfsHash}

#OwnTheRecord #ipfs
  `

  try {
    await T.post('statuses/update', {
      status: message,
      in_reply_to_status_id: tweet.replyTweet.id_str,
      auto_populate_reply_metadata: true
    }) 
  } catch(error) {
    console.error(error)
  }

  return message
}

module.exports.start = async (event) => {
  let allMentionedTweets = await getTweetMentions()
  // console.log('allMentionedTweets', allMentionedTweets.data)
  // console.log('Tweets found:', allMentionedTweets.data.length)

  let filterMentionedTweets = await filterProcessedTweets(allMentionedTweets)
  // console.log('filterMentionedTweets', filterMentionedTweets)  
  // console.log('Unsaved tweets:', filterMentionedTweets.length)

  let tweets = await getOriginalTweets(filterMentionedTweets)
  // console.log('tweets', tweets)

  // Loop through tweets
  let ipfsHashes = []
  for(let i = 0; i < tweets.length; i++) {
    let tweet = tweets[i]
    console.log(`@${tweet.user.screen_name}: ${tweet.text}`)

    ipfsHashes[i] = await saveTweet(tweets[i])
    let message = await replyToMention(tweet, ipfsHashes[i])
    console.log(`IPFS Hash: ${ipfsHashes[i]}`)
  }

  return ipfsHashes
};