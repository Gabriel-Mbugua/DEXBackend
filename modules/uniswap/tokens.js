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
        const tokenData = tokenList.find(token => token.symbol === symbol && token.chainId === chainId)

        // if (!Object.values(SUPPORTED_CHAINS).includes(chainId)) throw new Error(`${chain} is not supported.`);

        if(!tokenData.contractAddress) throw new Error(`Failed to fetch token data.`)

        if(tokenData.contractAddress === "NATIVE") {
            // Assuming native tokens have predefined decimals (most common is 18)
            const decimals = 18; // Common for ETH, BNB, and MATIC, but verify for each chain
            const name = tokenData.name;
            const tokenSymbol = tokenData.symbol;

            // Since there's no contract for native tokens, we can't create a Token instance in the same way
            // You might need to adjust how you're using the Token instance later on
            const token = {
                chainId,
                symbol: tokenSymbol,
                decimals,
                name,
            };

            return { token, decimals, symbol: tokenSymbol, name };
        }

        const tokenContract = new ethers.Contract(tokenData.contractAddress, ERC20_ABI, provider);
    
        const decimals = await tokenContract.decimals();
        const name = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();

        const token = new Token(
            chainId,
            tokenData.contractAddress,
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