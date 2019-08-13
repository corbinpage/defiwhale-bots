
module.exports.getMessageFromSNS = (input) => {
	let output = {}

	try {
		const sns = input["Records"][0]["Sns"]

		if(typeof sns["Message"] === 'string') {
			output = JSON.parse(sns["Message"])
		} else {
			output = sns["Message"]
		}
		
	} catch(error) {
		console.error(error)
	}

	return output
}