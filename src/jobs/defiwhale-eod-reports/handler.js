'use strict';

const axios = require('axios')
const uuid = require('uuid');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const {
  adjustTokenAmount,
  getPriceFromSymbol,
  getAddressForSymbol,
  formatAmount,
  sendTweetMessage } = require('./utils');

async function getTokenTransfersFromAlethio(tokenAddress, inputUrl='') {
	const base = 'https://api.aleth.io/'
	const version = 'v1'
  const limit = '100'
	const path = `/tokens/${tokenAddress}/tokenTransfers?page[limit]=${limit}`
  const url = inputUrl ? encodeURI(inputUrl) : `${base}${version}${path}`


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
		  url: url,
		  headers: headers,
		  params: params
		})

    // console.log(response)
    // console.log('-------')
    // console.log(response.data)

    return response.data
  } catch (error) {
    console.error(error)
    return {}
  }
}

async function calculate24hrTransferReport(tokenTransferSet) {
  let price = await getPriceFromSymbol(
    tokenTransferSet[0]['attributes']['symbol']
  )
  
  let firstBlock = tokenTransferSet[tokenTransferSet.length - 1]
  let report = {
    numberOfTransactions: 0,
    amount: 0,
    amountUsd: 0,
    price: price,
    tokenSymbol: tokenTransferSet[0]['attributes']['symbol'],
    firstBlockTime: firstBlock['attributes']['blockCreationTime'],
    lastBlockTime: tokenTransferSet[0]['attributes']['blockCreationTime']
  }

  tokenTransferSet.forEach((t, i) => {
    let value = t['attributes']['value']
    let decimals = t['attributes']['decimals']
    const amount = adjustTokenAmount(value, decimals)

    tokenTransferSet[i]['attributes']['adjustedAmount'] = amount
    tokenTransferSet[i]['attributes']['amountUsd'] = amount * report.price

    report.numberOfTransactions++
    report.amount = report.amount + amount
    report.amountUsd = report.amount * report.price
  })

  tokenTransferSet.sort((a, b) => {
    return b['attributes']['amountUsd'] - a['attributes']['amountUsd']
  })

  report['highest'] = tokenTransferSet[0]
  report['smallest'] = tokenTransferSet[tokenTransferSet.length - 1]
  report['top10'] = tokenTransferSet[9]
  report['median'] = tokenTransferSet[Math.round(tokenTransferSet.length / 2)]

  return report
}

function createMessageForStablecoinReport(reportData, currencies=['DAI', 'MKR', 'USDC']) {
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  let message = '🏄‍♂️🤙 24hr Stablecoin Transfer Report:\n\n'
  currencies.forEach((c, i) => {
    let _ = reportData[c]
    let nextText = `$${_.tokenSymbol}: $${usdformatter.format(_.amountUsd)}` +
      ` via ${formatAmount(_.numberOfTransactions)} txs\n`

    message += nextText
  })

  message += `\n#DeFi`

  return message
}

async function putReport(params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const timestamp = new Date().getTime();

  const record = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uuid.v1(),
      data: params,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }

  try {
    const response = await dynamoDb.put(record).promise();

    return response
  } catch (error) {
    console.error(error);
    return {error}
  }
};

async function queryFor24hrTransfersTransactions(tokenSymbol) {
  const tokenAddress = getAddressForSymbol(tokenSymbol)

  let tokenTransferSet = await getTokenTransfersFromAlethio(tokenAddress)

  let endTime = tokenTransferSet.data[0]['attributes']['blockCreationTime']
  const secondsPerDay = 60 * 60 * 24
  let startTime = endTime - secondsPerDay
  
  let transactions = tokenTransferSet.data
  let nextUrl = tokenTransferSet.links.next
  let keepQuerying = true

  while(keepQuerying) {
    let batch = await getTokenTransfersFromAlethio(tokenAddress, nextUrl)

    if(!batch.data) {
      console.log('Break')
      keepQuerying = false
      break
    } else {

      let lastTransaction = batch.data[batch.meta.count - 1]

      if(lastTransaction['attributes']['blockCreationTime'] < startTime ) {
        keepQuerying = false

        batch.data.forEach((d, i) => {
          if(d['attributes']['blockCreationTime'] >= startTime ) {
            transactions.push(d)
          }
        })
      } else {
        transactions = transactions.concat(batch.data)
        nextUrl = batch.links.next
      }
    }

  }

  return transactions 
}

module.exports.start = async (event) => {
  const {
    start
  } = require('./uniswapReport');

  const uniswapReport = await start()

}


module.exports.start2 = async (event) => {
  const currencies = ['DAI', 'MKR', 'USDC', 'TUSD', 'GUSD', 'USDT', 'PAX']
  // const currencies = ['USDC']

  let d = new Date()
  let allReports = {}
  let index

  for(index in currencies) {
    let transferSet = await queryFor24hrTransfersTransactions(currencies[index])
    let reportData = await calculate24hrTransferReport(transferSet)
    
    allReports[currencies[index]] = reportData
  }

  // Write report to DynamoDB
  let res = await putReport(allReports)

  console.log(res)
    
  // Create tweet message
  const stableCurrencies = ['DAI', 'USDC', 'USDT', 'PAX', 'TUSD']
  let tweet = createMessageForStablecoinReport(allReports, stableCurrencies)

  console.log(allReports)
  console.log(tweet)

  // Send message to lambda function to tweet
  // let response = await sendTweetMessage({message: tweet})
  // return response
}

