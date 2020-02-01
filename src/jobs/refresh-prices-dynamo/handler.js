'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const axios = require('axios');

async function getCMCPrices(currencies) {
	const base = 'https://pro-api.coinmarketcap.com/'
	const version = 'v1'
	const path = '/cryptocurrency/quotes/latest'

	let headers = {
  	'Accept': 'application/json',
  	'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY
  }

	let params = {
		symbol: currencies
	}

	try {
    const response = await axios({
		  method: 'get',
		  url: `${base}${version}${path}`,
		  headers: headers,
		  params: params
		})

    return response
  } catch (error) {
    console.error(error);
    return {}
  }
}

async function getPrices() {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const params = {
  Key: {
   "id": '1'
  }, 
  TableName: process.env.DYNAMODB_TABLE,
  ConsistentRead: true
  };

  try {
    const response = await dynamoDb.get(params).promise()

		return response
	} catch (error) {
	  console.error(error);
	  return error
	}
}

function formatParams(response) {
  const timestamp = new Date().getTime();

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: '1',
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
  const currencies = ['BTC', 'ETH', 'SAI', 'DAI', 'MKR', 'USDC', 'TUSD', 'GUSD', 'USDT', 'PAX']
	let response = await getCMCPrices(currencies.join(','))
	let params = formatParams(response)
	// console.log(params)

	let updateResponse = await putPrices(params)
	// console.log(updateResponse)

  // let response2 = await getPrices()
  // console.log(response2.Item.data.ETH.quote.USD.price)

	return updateResponse
};