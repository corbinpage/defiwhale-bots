const BigNumber = require("bignumber.js")

module.exports.adjustTokenAmount = async (amount_str, dec=18) => {
	const bigNumberValue = new BigNumber(output._value.toString())
  const value = bigNumberValue.shiftedBy(-1 * dec).decimalPlaces(2).toNumber()

	return value
}


