const Web3 = require('web3')
const {
  dynamoDbLibCall,
  getMessageFromSNS
  } = require('./utils');

let network = 'rinkeby'

module.exports.writeTransaction = async (event) => {
  let data = {
    transactionHash: "0x01d0e369e62911cf2d96d30023748a9f27876e0c206f421d1778f7db00922950",
    network: "rinkeby",
  }

  let item = await createTransaction(data)

  console.log(item)

}


module.exports.start = async (event) => {
  let item = {status: false}
  let data = event.Records && event.Records[0]

  if(data.eventName === 'INSERT') {
    console.log(event)
    console.log(data)
    console.log(data.dynamodb)
    const txHash = data.dynamodb.Keys.transactionHash.S
    network = data.dynamodb.NewImage.network.S

  
  // {
  //   transactionHash: "0x",
  //   network: "rinkeby",
  //   txStatus: 'Pending',
  //   createdAt: Date.now(),
  // }

  console.log('txHash', txHash)
  console.log('data', data)

  
    let output = await waitForTxConfirmation(txHash)

    if(output) {
      item = await updateTransaction(txHash, output)
      console.log('tx updated')
    } else {
      console.error('Tx confirmation timeout')
    }

  }

  return item
}

async function wait() {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("hello"), 1000)
  });
}

async function waitForTxConfirmation(txHash) {
  let web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/92981b973ff94916b3b49080d167689d`
    )
  )
  let output = null
  let receipt = {}

  for (let i = 0; i < 60; i++) { 
    output = await web3.eth.getTransactionReceipt(txHash)

    if(output) {
      // console.log(output)
      return output
    } 

    await wait()
  }

  return false
}

async function createTransaction(data) {
  const params = {
    TableName: 'ETH_TRANSACTIONS',
    Item: {
      transactionHash: data.transactionHash,
      network: data.network,
      txStatus: 'Pending',
      createdAt: Date.now(),
    },
  };

  try {
    await dynamoDbLibCall("put", params);
    return params.Item
  } catch (e) {
    console.error(e)
  }
}

async function updateTransaction(txHash, outputData) {
  const params = {
    TableName: 'ETH_TRANSACTIONS',
    Key: {
      transactionHash: txHash
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: "SET txData = :txData, completedAt = :completedAt, txStatus = :txStatus",
    ExpressionAttributeValues: {
      ":txData": outputData || null,
      ":txStatus": 'Complete',
      ":completedAt": Date.now()
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLibCall("update", params);
    return params.Item
  } catch (e) {
    console.error(e)
  }
}