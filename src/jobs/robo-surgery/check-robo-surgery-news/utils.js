const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

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
	let res = await sendSNSMessage('send-robo-surgery-tweet', params)

	return res
}
