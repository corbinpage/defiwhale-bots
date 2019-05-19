'use strict';
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

class Botani {
  // taskEnums = Object.freeze({
  //   "run-biz-rules": "run-biz-rules",
  //   "send-tweet": "send-tweet"
  // })


  constructor(obj, options={trigger: "Sns"}) {
    const sns = obj["Records"][0]["Sns"]
    // console.log(sns)
    const taskType = sns["MessageAttributes"]["task_type"]["Value"]
    const taskId = sns["MessageAttributes"]["task_id"]["Value"]
    const message = JSON.parse(sns["Message"])

    this.params = message.params;
    this.flowModel = message.flowModel;
    this.taskHistory = message.taskHistory;
    this.taskType = taskType;
    this.taskId = taskId;
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

    console.log(`Task #${this.taskId + 1}: ${this.taskType}`)

    return this
  }

  async nextTask() {
    const sns = new AWS.SNS({apiVersion: '2010-03-31'})
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

    var res = await sns.publish(params).promise()
    // console.log(res)

    return res
  }

  async finishTask() {
    if(this.params.nextTask == 'endFlow') {
      this.flowModel[this.taskHistory.length] = {
        task_type: this.params.nextTask
      }
      delete this.params.nextTask
    }

    console.log(`SUCCESS - Task #${this.taskHistory.length}`)
    console.log(`--params ${JSON.stringify(this.params)}`)
    console.log(`--flowModel ${JSON.stringify(this.flowModel)}`)
    console.log(`--taskHistory ${JSON.stringify(this.taskHistory)}`)

    return await this.nextTask()
  }

}

module.exports = Botani