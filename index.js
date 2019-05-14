const Dagger = require("eth-dagger");
const Botani = require("./src/lib/botani");

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

async function startCdpUpdate(message) {
	message = startTask('startCdpUpdate', message)
	Object.assign(message.params, {risk: "High"});

  finishTask('startBizRules', message)
}

async function startWhaleSpotting(message) {
	message = startTask('startWhaleSpotting', message)
	Object.assign(message.params, {amount: 1000, aboveAmount: 500});

  finishTask('startWhaleBizRules', message)
}

async function startBizRules(message) {
	message = startTask('startBizRules', message)

  finishTask('startEthTransaction', message)
}

async function startEthTransaction(message) {

	message = startTask('startEthTransaction', message)

  finishTask('complete', message)
}

async function sendTweet(message) {
	message = startTask(this.prototype.name, message)

  finishTask('complete', message)
}

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

function startTask(subject, message) {
	const order = message.taskHistory.length + 1
	message.taskHistory.push({
		subject: subject,
		order: order,
		startedAt: Date.now()
	})

	console.log(`Task #${order}: ${subject}`)

	return message
}

function finishTask(subject, message) {
	// Save message and task history

	addToQueue(subject, message)
}

async function addToQueue(subject, message) {
	switch(subject) {
	  case 'startCdpUpdate':
	  	startCdpUpdate(message)
	  	break;
	  case 'startBizRules':
	  	startBizRules(message)
	    break;
	  case 'startEthTransaction':
	  	startEthTransaction(message)
	    break;
	  default:
	    console.log(`No Lambda found.\n Subject: ${subject}\n Message: ${JSON.stringify(message)}`)
	} 
}

// addToQueue('startCdpUpdate', { params: {}, taskHistory: [] })

const bizRules = require("./src/run-biz-rules/handler");
bizRules.start();


