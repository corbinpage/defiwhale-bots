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
	const dayStartTime = currentTime - (currentTime % 86400)
	const query = `
		{
		  exchangeDayDatas(first: 10, orderBy: ethVolume, orderDirection: desc, where: {date: ${dayStartTime}, exchangeAddress_in: ["0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14", "0x2C4Bd064b998838076fa341A83d007FC2FA50957", "0x97deC872013f6B5fB443861090ad931542878126", "0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914", "0x4d2f5cFbA55AE412221182D8475bC85799A5644b", "0x3958b4ec427f8fa24eb60f42821760e88d485f7f"]}) {
		    id
		    date
		    exchangeAddress
		    ethVolume
		    ethBalance
		    tokenBalance
		    marginalEthRate
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

    response.data['dayId'] = dayStartTime

    return response.data
  } catch (error) {
    console.error(error)
    return {}
  }
}

async function putReport(params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const dateTime = parseInt((new Date().getTime() / 1000).toFixed(0))
  const dayTime = dateTime - (dateTime % 86400)
  const dayString = new Date(dateTime * 1000).toString()

  const record = {
    TableName: 'DAILY_UNISWAP_VOLUME_SUMMARY',
    Item: {
      dayId: params.dayId,
      dayString: dayString,
      data: params.data,
      createdAt: dateTime,
      updatedAt: dateTime
    },
  }

  try {
    const response = await dynamoDb.put(record).promise();

    // console.log(response)

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
    reportRecords[i]['poolSizeTkn'] = reportRecords[i].ethBalance * ethPrice
  })

  reportData.data.exchangeDayDatas = reportRecords

  return reportData
}

module.exports.start = async (event) => {
  const tempReport = await getUniswapDailyReportFromTheGraph()
  const uniswapReport = await calculate24hrUniswapReport(tempReport)

  // console.log(uniswapReport.data.exchangeDayDatas)

  // Write report to DynamoDB
  if(uniswapReport && uniswapReport.data.exchangeDayDatas) {
    let res = await putReport(uniswapReport)
  }

  return uniswapReport
}
