const { BigNumber, ethers } = require('ethers')
const JSBI = require('jsbi')

const READABLE_FORM_LEN = 4

const fromReadableAmount = (amount, decimals) => {
    return ethers.utils.parseUnits(amount, decimals)
}

const countDecimals = (x) => {
    if (Math.floor(x) === x) {
      return 0
    }
    return x.toString().split('.')[1].length || 0
  }

/* ------ calculates the amount of tokens in the Token's smallest unit ------ */
const fromReadableAmountToSmalletUnit = (amount, decimals) => {
    const extraDigits = Math.pow(10, countDecimals(amount))
    const adjustedAmount = amount * extraDigits
    return JSBI.divide(
      JSBI.multiply(
        JSBI.BigInt(adjustedAmount),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
      ),
      JSBI.BigInt(extraDigits)
    )
}
// console.log(fromReadableAmount(1000000000000000000, 18))
  

const toReadableAmount = (rawAmount, decimals) => {
    return ethers.utils
      .formatUnits(rawAmount, decimals)
      .slice(0, READABLE_FORM_LEN)
}

module.exports = {
    toReadableAmount,
    fromReadableAmount,
    fromReadableAmountToSmalletUnit,
}