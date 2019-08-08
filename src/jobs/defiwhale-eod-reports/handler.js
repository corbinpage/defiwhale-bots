'use strict';

// const uuid = require('uuid');
// const AWS = require('aws-sdk');
// AWS.config.update({region: 'us-east-1'});
const axios = require('axios')
// const Mustache = require('mustache')

async function getTokenTransfersFromAlethio(tokenAddress, url='') {
	const base = 'https://api.aleth.io/'
	const version = 'v1'
  const limit = '100'
	const path = url ? url : `/tokens/${tokenAddress}/tokenTransfers?page[limit]=${limit}`

  const auth = {
    username: process.env.ALETHIO_API_KEY,
    password: ''
  }

	let headers = {
  	'Accept': 'application/json'
  }

	let params = {}

	try {
    const response = await axios({
		  method: 'get',
      auth: auth,
		  url: `${base}${version}${path}`,
		  headers: headers,
		  params: params
		})

    console.log(response)
    console.log('-------')
    console.log(response.data)

    return response.data
  } catch (error) {
    console.error(error)
    return {}
  }
}

async function aggregateTransfers(tokenAddress, startTime, endTime) {
  let report = {
    keepQuerying: true,
    queryNumber: 0,
    nextUrl: null,
    dailyMetrics: {
      'DAI': {
        tokenSymbol: 'DAI',
        numberOfTransfers: 10000,
        amount: 10000,
        unadjustedAmount: 100
      }
    },
    transactions: []
  }

  let 

  while(report.keepQuerying) {
    let batch = await getTokenTransfersFromAlethio(MKRAddress, nextUrl)

    report = processTokenTransferBatch(report, batch, endTime)
  }

  // Write report to DynamoDB

  report["dailyMetrics"][tokenAddress][amount] = t["data"][0]["attributes"]["value"]

  // Loop
    // Query for transactions
    // Loop
      // checkTransaction()
      // Store in report


    // End
    // Query batch
    // Process batch
  // End
  return report
}

async function processTokenTransferBatch(report, batch, startTime, endTime) {
  let batchEarliestBlockCreationTime = 10000

  batch.data.forEach((t, i) => {



  })

    keepQuerying: true,
    queryNumber: 0,
    nextUrl: null,



  if(t.attributes.blockCreationTime < startTime) {
    report.keepQuerying = false
    report.nextUrl = null

  } else if(t.attributes.blockCreationTime > endTime) {

  } else {
    report.dailyMetrics['DAI']['numberOfTransfers']++
    report.dailyMetrics['DAI']['unadjustedAmount'] = 
      report.dailyMetrics['DAI']['unadjustedAmount'] + 

    tokenSymbol: 'DAI',
    numberOfTransfers: 10000,
    amount: 10000,
    unadjustedAmount: 100
  }


    dailyMetrics: {
      'DAI': {
        tokenSymbol: 'DAI',
        numberOfTransfers: 10000,
        amount: 10000,
        unadjustedAmount: 100
      }

  batch.data
  batch.links
  batch.meta



}

async function get24HRValues(tokenAddress) {
  // Get time range - unix to unix

  // let reportData = await aggregateTransfers(tokenAddress, startTime, endTime)

  // Save report



  // queryAllTransactions
  // read transactions
  // calculate24hrTransferReport()

  return {
    numberOfTransactions: 10000,
    amount: 100000,
    tokenSymbol: 'DAI'
  }
}

// function createMessage(params) {
//   params.numberOfTransactions = params.numberOfTransactions.toLocaleString()
//   params.amount = params.amount.toLocaleString()

//   let tweet = "📆 24 Hour {{tokenSymbol}} Summary:\n\n🔁 Total # of transfers: {{numberOfTransactions}}\n💸 Total Amount: {{amount}}"

//   return Mustache.render(tweet, params)
// }

// async function sendTweet(tweet) {
//   var T = new Twit({
//     consumer_key: process.env.TWITTER_CONSUMER_KEY,
//     consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//     access_token: process.env.TWITTER_ACCESS_TOKEN,
//     access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
//   })

//   return T.post('statuses/update', { status: tweet })
// }


// module.exports.start = async (event) => {
  async function start() {
  const MKRAddress = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'

  let tokenTransferSet = await getTokenTransfersFromAlethio(MKRAddress)
  console.log(tokenTransferSet)

  // let reportData = await get24HRValues(MKRAddress)
  // console.log(reportData)

  // let tweet = createMessage(reportData)
  // let response = await sendTweet(tweet)

  // console.log(tweet)

  // return response
}

// test()

// const DAIAddress = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
// const MKRAddress = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
// const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
// const GNTAddress = '0xa74476443119a942de498590fe1f2454d7d4ac0d'

// getTokenTransfers(DAIAddress)

start()

// async function getPrices(limit=10) {
// 	const dynamoDb = new AWS.DynamoDB.DocumentClient()

//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     Limit: limit
//   }

//   try {
//     const response = await dynamoDb.scan(params).promise()

// 		return response.Items
// 	} catch (error) {
// 	  console.error(error)
// 	  return error
// 	}
// }

// function formatParams(response) {
//   const timestamp = new Date().getTime()

//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     Item: {
//       id: uuid.v1(),
//       status: response.data.status,
//       data: response.data.data,
//       createdAt: timestamp,
//       updatedAt: timestamp,
//     },
//   }

//   return params
// }

// async function putPrices(params) {
// 	const dynamoDb = new AWS.DynamoDB.DocumentClient()

// 	try {
//     const response = await dynamoDb.put(params).promise()

//     return response
//   } catch (error) {
//     console.error(error)
//     return {error}
//   }
// };

// module.exports.start = async (event) => {
	// let response = await getCMCPrices("BTC,ETH,DAI,MKR,USDC")
	// let params = formatParams(response)
	// console.log(params)

	// let updateResponse = await putPrices(params)
	// console.log(updateResponse)

	// return updateResponse
// };

// async function test() {
// 	let response = await getPrices()
// 	console.log(response)
// 	console.log(response[0]['data']['MKR']['quote']['USD']['price'])
// 	// let params = formatParams(response)
// 	// console.log(params)
// 	// let updateResponse = await putPrices(params)
// }



