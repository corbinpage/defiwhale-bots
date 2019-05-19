'use strict';
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

	//Initialize rules engine
	const Engine = require('json-rules-engine').Engine
	const engine = new Engine()

	// Set facts, rules, and output
	let facts = JSON.parse(JSON.stringify(input.params))
	const Rule = require('json-rules-engine').Rule
	let rule = new Rule(JSON.stringify(input["flowModel"][taskId]["inputs"]["rule"]))
	engine.addRule(rule)

	// Run rules and store the result
	let result = await engine.run(facts)

	result.forEach(r => {
		if(r.success) {
			Object.assign(output.params, r.params);
			// output.flowModel = output.flowModel.concat(addTask)
		}
	})

	console.log("Input:")
	console.log(typeof input)
	console.log(input)
	console.log("Output:")
	console.log(typeof output)
	console.log(output)

	return await finishTask(output)
};