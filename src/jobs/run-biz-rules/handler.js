'use strict';
const Botani = require('/opt/nodejs/botani')
const Engine = require('json-rules-engine').Engine
const Rule = require('json-rules-engine').Rule

module.exports.start = async (event) => {
	const botani = new Botani(event, {trigger: "Sns"})
	botani.startTask()

	//Initialize rules engine
	const engine = new Engine()

	// Set facts, rules, and output
	let facts = JSON.parse(JSON.stringify(botani.params))
	let rule = new Rule(JSON.stringify(botani.flowModel[botani.taskId]["inputs"]["rule"]))
	engine.addRule(rule)

	// Run rules and store the result
	let result = await engine.run(facts)

	result.forEach(r => {
		if(r["type"] == "success") {
			Object.assign(botani.params, r.params);
		} else {
			Object.assign(botani.params, {nextTask: 'endFlow'});
		}
	})

	return await botani.finishTask()
};