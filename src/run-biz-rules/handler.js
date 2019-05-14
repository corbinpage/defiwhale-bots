'use strict';

module.exports.start = async (event) => {
	const Engine = require('json-rules-engine').Engine
	const engine = new Engine()

	let facts = {
	  amount: 1000
	}

	engine.addRule({
	  conditions: {
      all: [{
        fact: 'amount',
        operator: 'greaterThanInclusive',
        value: 500
      }]
	  },
	  event: {
	    type: 'true',
	    params: {
	      message: 'The condition is true!'
	    }
	  }
	})

	engine
  .run(facts)
  .then(events => { // run() returns events with truthy conditions
    events.map(event => console.log(event.params.message))
  })


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