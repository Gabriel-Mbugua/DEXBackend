const { BigNumber, ethers } = require('ethers')

const READABLE_FORM_LEN = 4


const toReadableAmount = (rawAmount, decimals) => {
    return ethers.utils
      .formatUnits(rawAmount, decimals)
      .slice(0, READABLE_FORM_LEN)
}

module.exports = {
    toReadableAmount
}