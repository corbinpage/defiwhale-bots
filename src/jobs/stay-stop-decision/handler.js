'use strict';
const Botani = require('./layer/nodejs/botani')
const Engine = require('json-rules-engine').Engine
const Rule = require('json-rules-engine').Rule

module.exports.start = async (event) => {
	const botani = new Botani(event, {
		trigger: "Sns",
		topicARN: process.env.NODE_ENV == 'prod' ? '' : ''
	})
	botani.startTask()

	//Initialize rules engine
	const engine = new Engine()

	// Set facts, rules, and output
	let facts = JSON.parse(JSON.stringify(botani.params))
	let rule = new Rule(JSON.stringify(botani.flowModel[botani.taskId]["inputs"]["rule"]))
	engine.addRule(rule)

	// Run rules and store the result
	let result = await engine.run(facts)
	let decision = result.length > 0
	Object.assign(botani.params, {decision: decision});
	if(!decision) {
		botani.removeFutureTasks()
	}
	
	
	return await botani.finishTask()
};