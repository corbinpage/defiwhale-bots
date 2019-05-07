const Dagger = require("eth-dagger");

// connect to Dagger ETH main network (network id: 1) over web socket
const dagger = new Dagger("wss://mainnet.dagger.matic.network"); // dagger server

// Use mqtt protocol for node (socket)
// const dagger = new Dagger('mqtts://mainnet.dagger.matic.network'); // dagger server

// get new block as soon as it gets created
dagger.on("latest:block", function(result) {
  console.log("New block created: ", result);
});

// get only block number (as it gets created)
dagger.on("latest:block.number", function(result) {
  console.log("Current block number: ", result);
});