// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set region
AWS.config.update({region: process.env.AWS_REGION});
AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY_ID});
AWS.config.update({secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

// Create publish parameters
var params = {
  Message: 'MESSAGE_TEXT', /* required */
  TopicArn: 'TOPIC_ARN'
};

// Create promise and SNS service object
var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

// Handle promise's fulfilled/rejected states
publishTextPromise.then(
  function(data) {
    console.log("Message ${params.Message} send sent to the topic ${params.TopicArn}");
    console.log("MessageID is " + data.MessageId);
  }).catch(
    function(err) {
    console.error(err, err.stack);
  });