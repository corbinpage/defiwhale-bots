
module.exports.getMessageFromSNS = (input) => {
	let output = {}

	try {
		const sns = input["Records"][0]["Sns"]
		output = JSON.parse(JSON.stringify(sns["Message"]))
	} catch(error) {
		console.error(error)
	}
	
	return output
}