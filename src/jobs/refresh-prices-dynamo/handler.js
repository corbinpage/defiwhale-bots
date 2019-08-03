'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const axios = require('axios');

async function getPrices(currencies) {
	const base = 'https://pro-api.coinmarketcap.com/'
	const version = 'v1'
	const path = '/cryptocurrency/quotes/latest'

	let params = {
		symbol: currencies
	}

	try {
    const response = await axios({
		  method: 'get',
		  url: `${base}${version}${path}`,
		  headers: {
		  	'Accept': 'application/json',
		  	'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY
		  },
		  params: params
		})

    return response
  } catch (error) {
    console.error(error);
    return {}
  }
}

function formatParams(response) {
  const timestamp = new Date().getTime();

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uuid.v1(),
      status: response.data.status,
      data: response.data.data,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }

  return params
}

async function putPrices(params) {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

	try {
    const response = await dynamoDb.put(params).promise();

    return response
  } catch (error) {
    console.error(error);
    return {error}
  }
};

module.exports.start = async (event) => {
	let response = await getPrices("BTC,ETH,DAI,MKR,USDC")
	let params = formatParams(response)
	console.log(params)
	
	let updateResponse = await putPrices(params)
	console.log(updateResponse)

	return updateResponse
};

// async function test() {
// 	let response = await getPrices("BTC,ETH,DAI,MKR,USDC")
// 	let params = formatParams(response)
// 	console.log(params)
// 	let updateResponse = await putPrices(params)
// }

// test()

