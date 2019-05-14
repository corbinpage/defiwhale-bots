const Dagger = require("eth-dagger");

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
	message = updateTask('startCdpUpdate', message)
	Object.assign(message.params, {risk: "High"});

  finishTask('startBizRules', message)
}

async function startBizRules(message) {
	message = updateTask('startBizRules', message)

  finishTask('startEthTransaction', message)
}

async function startEthTransaction(message) {
	message = updateTask('startEthTransaction', message)

  finishTask('complete', message)
}


// trigger -> queue

// queue -> getData -> queue

// queue -> run business rules -> send OR save

function updateTask(subject, message) {
	const order = message.taskHistory.length + 1
	message.taskHistory.push({
		subject: subject,
		order: order
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

addToQueue('startCdpUpdate', { params: {}, taskHistory: [] })


