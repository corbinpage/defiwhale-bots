'use strict';

const axios = require('axios')
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
  let report = {
    numberOfTransactions: 0,
    amount: 0,
    amountUsd: 0,
    price: price,
    tokenSymbol: tokenTransferSet[0]['attributes']['symbol']
  }

  let lastBlockTime = tokenTransferSet[0]['attributes']['blockCreationTime']
  let firstBlock = tokenTransferSet[tokenTransferSet.length - 1]
  let firstBlockTime = firstBlock['attributes']['blockCreationTime']

  // console.log(`Length: ${tokenTransferSet.length} -- Start: ${firstBlockTime} -- End: ${lastBlockTime}`)

  tokenTransferSet.forEach((t, i) => {
    let value = t['attributes']['value']
    let decimals = t['attributes']['decimals']
    const amount = adjustTokenAmount(value, decimals)

    report.numberOfTransactions++
    report.amount = report.amount + amount
    report.amountUsd = report.amount * report.price
  })

  return report
}

function createMessage(reportData, currencies=['DAI', 'MKR', 'USDC']) {
  let message = '🏄‍♂️🤙 24hr Stablecoin Report:\n\n'
  currencies.forEach((c, i) => {
    let _ = reportData[c]
    let nextText = `$${_.tokenSymbol}: ${formatAmount(_.amountUsd, true)}` +
      ` moved via ${formatAmount(_.numberOfTransactions)} txs\n`

    message += nextText
  })

  message += `\n#DeFi`

  return message
}

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

  // Write report to DynamoDB
  // report["dailyMetrics"][tokenAddress][amount] = t["data"][0]["attributes"]["value"]

  return transactions 
}


module.exports.start = async (event) => {
  // const currencies = ['DAI', 'MKR', 'USDC', 'TUSD', 'GUSD', 'USDT', 'PAX']
  const currencies = ['DAI', 'USDC', 'USDT', 'PAX', 'TUSD']
  let allReports = {}
  let index

  for(index in currencies) {
    let transferSet = await queryFor24hrTransfersTransactions(currencies[index])
    let reportData = await calculate24hrTransferReport(transferSet)
    
    console.log(reportData)
    console.log('-----')

    allReports[currencies[index]] = reportData
  }

  let tweet = createMessage(allReports, currencies)

  console.log(tweet)

  // let response = await sendTweetMessage(message: tweet)

  // return response
}

