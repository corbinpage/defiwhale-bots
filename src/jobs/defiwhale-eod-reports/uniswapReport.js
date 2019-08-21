'use strict';

const axios = require('axios')
const uuid = require('uuid');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const {
  getPriceFromSymbol,
  formatAmount,
  getExchangeAddressForSymbol,
  sendTweetMessage } = require('./utils');

async function getUniswapDailyReportFromTheGraph(startDate=new Date(), currencies=['DAI','MKR','USDC','BAT','WBTC']) {
	const currentTime = parseInt((startDate.getTime() / 1000).toFixed(0))
	const dayStartTime = currentTime - (currentTime % 864000)
	const query = `
		{
		  exchangeDayDatas(first: 5, sorderBy: date, orderDirection: desc, where: {date: ${dayStartTime}, exchangeAddress_in: ["0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14", "0x2C4Bd064b998838076fa341A83d007FC2FA50957", "0x97deC872013f6B5fB443861090ad931542878126", "0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914", "0x4d2f5cFbA55AE412221182D8475bC85799A5644b"]}) {
		    id
		    date
		    exchangeAddress
		    ethVolume
		    ethBalance
		    tokenBalance
		    marginalEthRate
		    ROI
		    tokenPriceUSD
		    totalEvents
		  }
		}
		`
  const url = `https://api.thegraph.com/subgraphs/name/graphprotocol/uniswap`

	let headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

	try {
    const response = await axios({
		  method: 'POST',
		  url: url,
		  headers: headers,
		  data: JSON.stringify({
		    query
		  })
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

async function createMessageForUniswapReport(reportData, currencies=['DAI', 'MKR', 'USDC', 'BAT', 'WBTC']) {
  let reportRecords = reportData.data.exchangeDayDatas
  let usdformatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });
  const ethPrice = await getPriceFromSymbol('ETH')
  let message = '🦄💱 24hr Uniswap Report:\n\n'
  message += '--Daily Volume / Pool Size--\n'

  currencies.forEach((c, i) => {
  	const exchangeAddress = getExchangeAddressForSymbol(c)

  	const record = reportRecords.filter(r => {
  		return r.exchangeAddress.toUpperCase() === exchangeAddress.toUpperCase()
  	})

  	if(record && record[0]) {
  		let _ = record[0]
  		_.ethVolumeUsd = _.ethVolume * ethPrice
  		_.poolSize = _.tokenBalance * _.tokenPriceUSD

    	let nextText = `$${c}: $${usdformatter.format(_.ethVolumeUsd)} ` +
      	`/ $${usdformatter.format(_.poolSize)}\n`

      message += nextText
  	}
  })

  message += `\n#DeFi`

  return message
}

async function putReport(params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const timestamp = new Date().getTime();

  const record = {
    TableName: 'DAILY_UNISWAP_SUMMARY',
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



module.exports.start = async (event) => {
	const uniswapReport = await getUniswapDailyReportFromTheGraph()

  // Write report to DynamoDB
  let res = await putReport(uniswapReport)

  // console.log(res)
    
  // Create tweet message
  const uniswapCurrencies = ['DAI', 'MKR', 'USDC', 'BAT', 'WBTC']
  let tweet = await createMessageForUniswapReport(uniswapReport, uniswapCurrencies)

  console.log(uniswapReport)
  console.log(tweet)

  // Send message to lambda function to tweet
  // let response = await sendTweetMessage({message: tweet})
  // return response
}
