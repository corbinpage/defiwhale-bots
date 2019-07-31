'use strict';
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function getFlowModel() {
  return [
    {
      task_type: 'stay-stop-decision',
      inputs: {
        rule: {
          "conditions": {
            "priority": 1,
            "all": [
              { "operator": "greaterThanInclusive", "value": 10000, "fact": "amount" }
            ]
          },
          "priority": 1,
          "event": {
            "type": "success",
            "params": {
              decision: true
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
}

module.exports.start = async (event) => {
  const sns = new AWS.SNS({apiVersion: '2010-03-31'})

  console.log('REQUEST')
  console.log(JSON.stringify(event))

  let params = event.body ? JSON.parse(event.body) :  {}
  let flowModel = getFlowModel()

  const input = {
    params: params,
    flowModel: flowModel,
    taskHistory: []
  }

  let snsParams = {
    Message: JSON.stringify(input),
    TopicArn: 'arn:aws:sns:us-east-1:061031305521:botani',
    MessageAttributes: {
      'task_type': {
        DataType: 'String',
        StringValue: flowModel[0]["task_type"]
      },
      'task_id': {
        DataType: 'Number',
        StringValue: '0'
      }
    }
  }

  var res = await sns.publish(snsParams).promise()

  console.log('RESPONSE')
  console.log(`Starting Task: ${input.flowModel[0]["task_type"]}`)

  return {
    statusCode: 200,
    body: JSON.stringify({
      response: res,
      input: event,
    }, null, 2),
  }
};
