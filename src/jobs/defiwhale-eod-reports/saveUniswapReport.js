'use strict';

const axios = require('axios')
const uuid = require('uuid');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const {
  getPriceFromSymbol,
  getSymbolForExchangeAddress
  } = require('./utils');

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

function orderReportByVolume(reportData) {
  reportData.sort((a,b) => (
    Number(a.ethVolume) < Number(b.ethVolume)) ? 1 :
      ((Number(b.ethVolume) < Number(a.ethVolume)) ? -1 : 0)
  ); 

  return reportData
}

async function calculate24hrUniswapReport(reportData) {
  let reportRecords = orderReportByVolume(reportData.data.exchangeDayDatas)
  const ethPrice = await getPriceFromSymbol('ETH')

  reportRecords.forEach((r, i) => {
    reportRecords[i]['tokenSymbol'] = getSymbolForExchangeAddress(reportRecords[i]['exchangeAddress'])
    reportRecords[i]['ethVolumeUsd'] = reportRecords[i].ethVolume * ethPrice
    reportRecords[i]['poolSize'] = reportRecords[i].tokenBalance * reportRecords[i].tokenPriceUSD
  })

  reportData.data.exchangeDayDatas = reportRecords

  return reportData
}

module.exports.start = async (event) => {
  const tempReport = await getUniswapDailyReportFromTheGraph()
	const uniswapReport = await calculate24hrUniswapReport(tempReport)

  console.log(uniswapReport.data.exchangeDayDatas)

  // Write report to DynamoDB
  if(uniswapReport && uniswapReport.data.exchangeDayDatas) {
  	let res = await putReport(uniswapReport)
  }

  return uniswapReport
}
