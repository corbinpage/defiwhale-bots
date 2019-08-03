'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
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

    console.log(response);
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

function putPrices(params) {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

  // write the prices to the database
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t create the todo item.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item.data),
    };
    callback(null, response);
  });
};

module.exports.start = async (event) => {
	let response = await getPrices("BTC,ETH,DAI,MKR,USDC")
	let params = formatParams(response)
	let updateResponse = putPrices(params)

	return updateResponse
};

// async function yo() {
// 	let response = await getPrices("BTC,ETH,DAI,MKR,USDC")
// 	let params = formatParams(response)
// 	console.log(params)
// }

// yo()


// function getPrices(params) {
// 	const dynamoDb = new AWS.DynamoDB.DocumentClient();

// module.exports.get = (event, context, callback) => {
//   const params = {
//     TableName: process.env.DYNAMODB_TABLE,
//     Key: {
//       id: event.pathParameters.id,
//     },
//   };

//   // fetch todo from the database
//   dynamoDb.get(params, (error, result) => {
//     // handle potential errors
//     if (error) {
//       console.error(error);
//       callback(null, {
//         statusCode: error.statusCode || 501,
//         headers: { 'Content-Type': 'text/plain' },
//         body: 'Couldn\'t fetch the todo item.',
//       });
//       return;
//     }

//     // create a response
//     const response = {
//       statusCode: 200,
//       body: JSON.stringify(result.Item),
//     };
//     callback(null, response);
//   });
// };

