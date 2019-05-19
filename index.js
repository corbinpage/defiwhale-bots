const Dagger = require("eth-dagger");
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

// connect to Dagger ETH main network (network id: 1) over web socket
// const dagger = new Dagger("wss://mainnet.dagger.matic.network"); // dagger server

// Use mqtt protocol for node (socket)
// const dagger = new Dagger('mqtts://mainnet.dagger.matic.network'); // dagger server

// get new block as soon as it gets created
// dagger.on("latest:block", function(result) {
//   console.log("New block created: ", result);
// });

// // get only block number (as it gets created)
// dagger.on("latest:block.number", function(result) {
//   console.log("Current block number: ", result);
// });

// async function startCdpUpdate(message) {
// 	message = startTask('startCdpUpdate', message)
// 	Object.assign(message.params, {risk: "High"});

//   finishTask('startBizRules', message)
// }

// async function startWhaleSpotting(message) {
// 	message = startTask('startWhaleSpotting', message)
// 	Object.assign(message.params, {amount: 1000, aboveAmount: 500});

//   finishTask('startBizRules', message)
// }

// async function startEthTransaction(message) {

// 	message = startTask('startEthTransaction', message)

//   finishTask('complete', message)
// }

// async function sendTweet(message) {
// 	message = startTask(this.prototype.name, message)

//   finishTask('complete', message)
// }

// WhaleSpotting
// "Monitor token transfers" => "if it's bigger than a certain amount" => "Tweet about it"





// "Text notification on phone"
// "If my CDP is approaching liquidation, then top off your CDP."
// "If the price of Ethereum drops below $300, then trade your ether for dai."
// If a DAO I participate in starts a vote, then send a text notification to your phone.

// App
// DB
//   --FlowModels
//   --TaskModels
//   --Users






// trigger -> queue

// queue -> getData -> queue

// queue -> run business rules -> send OR save

// function startTask(subject, message) {
// 	const order = message.taskHistory.length + 1
// 	message.taskHistory.push({
// 		subject: subject,
// 		order: order,
// 		startedAt: Date.now()
// 	})

// 	console.log(`Task #${order}: ${subject}`)

// 	return message
// }

// function finishTask(subject, message) {
// 	// Save message and task history

// 	console.log(`Output: ${JSON.stringify(message)}`)

// 	addToQueue(subject, message)
// }

// async function addToQueue(subject, message) {
// 	switch(subject) {
// 	  case 'startCdpUpdate':
// 	  	startCdpUpdate(message)
// 	  	break;
// 	  case 'startWhaleSpotting':
// 	  	startWhaleSpotting(message)
// 	  	break;
// 	  case 'startBizRules':
// 	  	const bizRules = require("./src/run-biz-rules/handler");

// 	  	message = startTask('startBizRules', message)
// 			let response = await bizRules.start(message);

// 			finishTask('sendTweet', JSON.parse(response.body).data)
// 	    break;
// 	  case 'sendTweet':
// 	  	const sendTweet = require("./src/send-tweet/handler");

// 	  	message = startTask('sendTweet', message)
// 			let twitterResponse = await sendTweet.start(message);

// 			finishTask('complete', JSON.parse(twitterResponse.body).data)
// 	    break;
// 	  case 'startEthTransaction':
// 	  	startEthTransaction(message)
// 	    // break;
// 	  default:
// 	    console.log(`------------\nNo next step\nParams: ${JSON.stringify(message.params)}\nTask History: ${JSON.stringify(message.taskHistory)}`)
// 	} 
// }

async function startFlow(flowModel, params) {
	const sns = new AWS.SNS({apiVersion: '2010-03-31'})
	const message = {
		params: params,
		flowModel: flowModel,
		taskHistory: []
	}

	let snsParams = {
	  Message: JSON.stringify(message),
	  TopicArn: 'arn:aws:sns:us-east-1:061031305521:botani',
	  MessageAttributes: {
	    'task_type': {
	      DataType: 'String',
	      StringValue: message.flowModel[0]["task_type"]
	    },
	    'task_id': {
	      DataType: 'Number',
	      StringValue: '0'
	    }
    }
	}

	var res = await sns.publish(snsParams).promise()

	return res
}

const flowModel = [
	{
		task_type: 'run-biz-rules',
		inputs: {
			rule: {
				"conditions": {
					"priority": 1,
					"all": [
						{ "operator": "greaterThanInclusive", "value": 5000, "fact": "amount" }
					]
				},
				"priority": 1,
				"event": {
					"type": "success",
					"params": {
						nextTask: "send-tweet"
					}
				}
			}
		}
	},
	{
		task_type: 'send-tweet',
		inputs: {
			tweetMessage: 'Ahoy! {{amount}} {{symbol}} transfer spotted!\n\nhttps://etherscan.io/tx/{{transactionHash}}'
		}
	}
]
const inputs = {
	amount: 20000,
	symbol: 'ETH',
	transactionHash: '0xabc'
}
startFlow(flowModel, inputs)


