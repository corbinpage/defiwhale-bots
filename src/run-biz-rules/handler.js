'use strict';

module.exports.start = async (event) => {
	const input = event.Records[0].Sns.Message
	// let input = JSON.parse(JSON.stringify(event["Records"][0]["Sns"]["Message"]))
	
	console.log(typeof input)
	console.log(typeof JSON.parse(input))

	let output = JSON.parse(JSON.stringify(input))

	console.log(typeof input)
	console.log(typeof output)

	//Initialize rules engine
	const Engine = require('json-rules-engine').Engine
	const engine = new Engine()

	console.log('EVENT')
	console.log(JSON.stringify(input))
	console.log(input)
	console.log(typeof input)
	console.log(typeof output)
	console.log(JSON.stringify(output))

	// Set facts, rules, and output
	let facts = input.params

console.log(JSON.stringify(facts))


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
      input: input,
    }, null, 2),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};