const { BigNumber, ethers } = require('ethers')

const READABLE_FORM_LEN = 4

const fromReadableAmount = (amount, decimals) => {
    return ethers.utils.parseUnits(amount, decimals)
}
  

const toReadableAmount = (rawAmount, decimals) => {
    return ethers.utils
      .formatUnits(rawAmount, decimals)
      .slice(0, READABLE_FORM_LEN)
}

module.exports = {
    fromReadableAmount,
    toReadableAmount
}