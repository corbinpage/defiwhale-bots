'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};



require('dotenv').config()
const ethers = require('ethers');
const ENV = process.env.ENV;

const address_from = process.env.ADDRESS_0;
const pKey_from = process.env.PRIVATE_0;

module.exports.start = async params => {
  const { toAddress, amt, taskId, taskHistory } = params;
  let provider = ethers.getDefaultProvider(ENV);
  let _amount = ethers.utils.parseEther(amt.toString());
  
  let wallet = new ethers.Wallet(pKey_from, provider);
  let tx = {
    to: toAddress,
    value: _amount
  };
  // console.log('starting transaction', tx);
  const result = await wallet.sendTransaction(tx);
  // console.log('sent', result);
  // const key = {
  //   'id': taskId,
  // };
  // let date = new Date();
  // let timestamp = date.getTime();
  // const newHistory ={
  //   startTime: timestamp.toString(10),
  //   txHash: result.hash,
  //   status: 'success',
  // }
  // taskHistory.push(newHistory);
  // const updateData = {
  //   taskHistory,
  // }
}