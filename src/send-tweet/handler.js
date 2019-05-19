'use strict';
require('dotenv').config()
const Twit = require("twit");
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function startTask(type, input) {
	const order = input.taskHistory.length + 1
	input.taskHistory.push({
		type: type,
		input: JSON.parse(JSON.stringify(input)),
		order: order,
		startedAt: Date.now()
	})

	console.log(`Task #${order}: ${type}`)

	return input
}

async function finishTask(input) {
	const sns = new AWS.SNS({apiVersion: '2010-03-31'})
	let params = {
	  Message: JSON.stringify(input),
	  TopicArn: 'arn:aws:sns:us-east-1:061031305521:botani',
	  MessageAttributes: {
	    'task_type': {
	      DataType: 'String',
	      StringValue: '<tbd>'
	    },
	    'task_id': {
	      DataType: 'Number',
	      StringValue: input.taskHistory.length.toString()
	    }
    }
	};

	if(input.taskHistory.length >= input.flowModel.length) {
		params.MessageAttributes["task_type"]["StringValue"] = 'endFlow'
	} else {
		params.MessageAttributes["task_type"]["StringValue"] = input.flowModel[input.taskHistory.length + 1]['task_type']
	}

	var res = await sns.publish(params).promise()
	// console.log(res)

	console.log(`DONE - Task #${input.taskHistory.length}`)

	return res
}

module.exports.start = async (event) => {
	const sns = event["Records"][0]["Sns"]
	// console.log(sns)

	const input = JSON.parse(sns["Message"])

	const taskType = sns["MessageAttributes"]["task_type"]["Value"]
	const taskId = sns["MessageAttributes"]["task_id"]["Value"]
	let output = JSON.parse(JSON.stringify(input))
	output = startTask(taskType, output)
	const tweetMessage = input.params.tweetMessage

	var T = new Twit({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token: process.env.TWITTER_ACCESS_TOKEN,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	})



	// let response = await T.post('statuses/update', { status: tweetMessage })
	let response = "temp"
	console.log(tweetMessage)
	Object.assign(output.params, {tweetSent: true});

	return await finishTask(output)
};
