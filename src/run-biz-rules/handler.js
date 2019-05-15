'use strict';

module.exports.start = async (event) => {
	let output = JSON.parse(JSON.stringify(event))

	//Initialize rules engine
	const Engine = require('json-rules-engine').Engine
	const engine = new Engine()

	// Set facts, rules, and output
	let facts = event.params
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
	    	result: true,
	      message: 'The condition is true!'
	    }
	  }
	})

	// Run rules and store the result
	let result = await engine.run(facts)

	result.forEach(r => {
		Object.assign(output.params, r.params);
	})

	// Return the results
  return {
    statusCode: 200,
    body: JSON.stringify({
      data: output,
      input: event,
    }, null, 2),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};