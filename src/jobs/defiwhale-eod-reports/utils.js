const BigNumber = require("bignumber.js")
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

module.exports.adjustTokenAmount = (amount_str, dec=18) => {
	const bigNumberValue = new BigNumber(amount_str.toString())
  const value = bigNumberValue.shiftedBy(-1 * dec).decimalPlaces(2).toNumber()

	return value
}

module.exports.formatAmount = (amount, isCurrency=false, includeDecimals=true) => {
	let usNumberFormatter = new Intl.NumberFormat('en-US');
  let usdformatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: includeDecimals ? 2 : 0
  });
  let output = 0

  if(!isCurrency) {
  	output = usNumberFormatter.format(amount.toFixed(2))
  } else {
  	output = usdformatter.format(amount)
  }

	return output
}

module.exports.getAddressForSymbol = (tokenSymbol='DAI') => {
	let address = '0x'
	const DAIAddress = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
	const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
	const TUSDAddress = '0x8dd5fbce2f6a956c3022ba3663759011dd51e73e'
	const GUSDAddress = '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd'
	const USDTAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'
	const PAXAddress = '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
	const MKRAddress = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
	const GNTAddress = '0xa74476443119a942de498590fe1f2454d7d4ac0d'
	const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

	switch(tokenSymbol) {
		case 'DAI':
			address = DAIAddress
		break
		case 'USDC':
			address = USDCAddress
		break
		case 'TUSD':
			address = TUSDAddress
		break
		case 'GUSD':
			address = GUSDAddress
		break
		case 'USDT':
			address = USDTAddress
		break
		case 'PAX':
			address = PAXAddress
		break
		case 'MKR':
			address = MKRAddress
		break
		case 'GNT':
			address = GNTAddress
		break
	}

	return address
}

module.exports.getExchangeAddressForSymbol = (tokenSymbol='DAI') => {
	let address = '0x'
  const DAIExchangeAddress = '0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14'
  const MKRExchangeAddress = '0x2C4Bd064b998838076fa341A83d007FC2FA50957'
  const USDCExchangeAddress = '0x97deC872013f6B5fB443861090ad931542878126'
  const BATExchangeAddress = '0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914'
  const WBTCxchangeAddress = '0x4d2f5cFbA55AE412221182D8475bC85799A5644b'

	switch(tokenSymbol) {
		case 'DAI':
			address = DAIExchangeAddress
		break
		case 'MKR':
			address = MKRExchangeAddress
		break
		case 'USDC':
			address = USDCExchangeAddress
		break
		case 'BAT':
			address = BATExchangeAddress
		break
		case 'WBTC':
			address = WBTCxchangeAddress
		break
	}

	return address
}

async function getPrices(limit=10) {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: 'BOTANI_PRICES',
    Limit: limit
  }

  try {
    const response = await dynamoDb.scan(params).promise()

		return response.Items[0]['data']
	} catch (error) {
	  console.error(error);
	  return {}
	}
}

module.exports.getLatestItem = async (tableName) => {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();
	const d = Math.floor(Date.now() / 1000)
	const dayStart = d - (d % 86400)

  const params = {
    TableName: tableName,
    KeyConditionExpression: "createdAt >= :a",
    ExpressionAttributeValues: {
        ":a": dayStart
    }
    // KeyConditionExpression: "ID = :id",
    ScanIndexForward: false
  }

  try {
    const response = await dynamoDb.scan(params).promise()

		return response.Items[0]
	} catch (error) {
	  console.error(error);
	  return {}
	}
}

module.exports.getMostRecentItem = async (tableName) => {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: tableName,
    KeyConditionExpression: "createdAt = :createdAt",
    ExpressionAttributeValues : {
        ':createdAt' : createdAtTime     
    }
    ScanIndexForward: false
  }

  try {
    const response = await dynamoDb.query(params).promise()

		return response.Items[0]
	} catch (error) {
	  console.error(error);
	  return {}
	}
}

module.exports.getPriceFromSymbol = async (symbol='DAI') => {
	const prices = await getPrices()
	let price = 0

	try {
		price = prices[symbol]['quote']['USD']['price'] || 0
		price = price.toFixed(2)
	} catch(error) {
		console.error(error)
	}

	return price
}

async function getDailyTransferReports(limit=1) {
	const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: 'DAILY_TRANSFER_SUMMARY',
    Limit: limit
  }

  try {
    const response = await dynamoDb.scan(params).promise()

		return response.Items
	} catch (error) {
	  console.error(error);
	  return {}
	}
}

module.exports.getLatestTransferReport = async () => {
	const dailyReports = await getDailyTransferReports()
	let price = 0

	return dailyReports[0]
}

module.exports.getMessageFromSNS = (input) => {
	let output = {}

	try {
		const sns = input["Records"][0]["Sns"]

		if(typeof sns["Message"] === 'string') {
			output = JSON.parse(sns["Message"])
		} else {
			output = sns["Message"]
		}
		
	} catch(error) {
		console.error(error)
	}

	return output
}

async function sendSNSMessage(topic, params) {
	const sns = new AWS.SNS(
    {apiVersion: '2010-03-31'}
  )
  const queueArn = `arn:aws:sns:us-east-1:061031305521:${topic}`
	let snsParams = {
	  Message: JSON.stringify(params),
	  TopicArn: queueArn
	}

	var res = await sns.publish(snsParams).promise()

	return res
}

module.exports.sendTweetMessage = async (params) => {
	let res = await sendSNSMessage('send-tweet-message', params)

	return res
}
