'use strict';
const AWS = require('aws-sdk');

class Botani {
  // taskEnums = Object.freeze({
  //   "run-biz-rules": "run-biz-rules",
  //   "send-tweet": "send-tweet"
  // })


  constructor(obj, options={trigger: "Sns"}) {
    this.configureAWS()
    const sns = obj["Records"][0]["Sns"]

    const message = JSON.parse(sns["Message"])

    this.params = message.params;
    this.flowModel = message.flowModel;
    this.taskHistory = message.taskHistory;
    this.taskType = '';
    this.taskId = 0;
  }

  configureAWS() {
    AWS.config.update({region: 'us-east-1'});
    const useLocal = process.env.NODE_ENV !== 'production'
    const snsClient = new AWS.SNS({
      apiVersion: '2010-03-31',
      endpoint: useLocal ? 'http://localhost:4575' : undefined,
    })
    this.sns = snsClient
  }

  toJSON() {
    let output = {
      params: this.params,
      flowModel: this.flowModel,
      taskHistory: this.taskHistory,
    }

    return JSON.stringify(output)
  }

  startTask() {
    this.taskHistory.push({
      type: this.taskType,
      input: JSON.parse(JSON.stringify(this.params)),
      order: this.taskId,
      startedAt: Date.now()
    })

    // console.log(`Task #${this.taskId}: ${this.taskType}`)

    return this
  }

  removeFutureTasks() {
    this.flowModel = this.flowModel.splice(0, this.taskId);
  }

  async nextTask() {
    let params = {
      Message: this.toJSON(),
      TopicArn: 'arn:aws:sns:us-east-1:061031305521:botani',
      MessageAttributes: {
        'task_type': {
          DataType: 'String',
          StringValue: '<tbd>'
        },
        'task_id': {
          DataType: 'Number',
          StringValue: this.taskHistory.length.toString()
        }
      }
    };

    if(this.taskHistory.length >= this.flowModel.length) {
      params.MessageAttributes["task_type"]["StringValue"] = 'endFlow'
    } else {
      params.MessageAttributes["task_type"]["StringValue"] = this.flowModel[this.taskHistory.length]['task_type']
    }

    var res = await this.sns.publish(params).promise()
    // console.log(res)

    return res
  }

  async finishTask() {
    console.log(`SUCCESS - Task #${this.taskId}`)
    console.log(`--params ${JSON.stringify(this.params)}`)
    console.log(`--flowModel ${JSON.stringify(this.flowModel)}`)
    console.log(`--taskHistory ${JSON.stringify(this.taskHistory)}`)

    return await this.nextTask()
  }

}

module.exports = Botani