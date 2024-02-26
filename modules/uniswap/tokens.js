// const { SupportedChainId, Token } = require('@uniswap/sdk-core')
const { Token, SUPPORTED_CHAINS } = require('@uniswap/sdk-core')
const { ethers } = require('ethers');
const { getChainId, getRpcUrl, tokenList } = require('./constants')

const ERC20_ABI = require('../abi/erc20.json')


const fetchToken = async ({
    chain,
    symbol,
    provider
}) => {
    try{
        const chainId = getChainId(chain)
        const { contractAddress } = tokenList.find(token => token.symbol === symbol && token.chainId === chainId)

        if (!Object.values(SUPPORTED_CHAINS).includes(chainId)) throw new Error(`${chain} is not supported.`);

        if(!contractAddress) throw new Error(`Failed to fetch token data.`)

        const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    
        const decimals = await tokenContract.decimals();
        const name = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();

        const token = new Token(
            chainId,
            contractAddress,
            Number(decimals),
            tokenSymbol,
            name,
        )
        
        return { token, decimals, symbol, name };

    }catch(err){
        console.error(err)
    }
}
// fetchToken({
//     chain: 'ethereum',
//     symbol: 'USDC'
// }).then(res => console.log(res))

module.exports = {
    fetchToken
}   