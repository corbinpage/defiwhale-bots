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

module.exports = {startTask, finishTask}