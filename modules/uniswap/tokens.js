// const { SupportedChainId, Token } = require('@uniswap/sdk-core')
const { Token, SUPPORTED_CHAINS, NativeCurrency} = require('@uniswap/sdk-core')
const { ethers } = require('ethers');
const { getChainId, getRpcUrl, tokenList, getProvider } = require('./constants')

const ERC20_ABI = require('../abi/erc20.json')


const fetchToken = async ({
    chain,
    symbol,
    provider
}) => {
    try{
        const chainId = getChainId(chain)
        const tokenData = tokenList.find(token => token.symbol === symbol && token.chainId === chainId)

        if(!provider) provider = await getProvider(chain)

        if(!tokenData?.contractAddress && !tokenData?.native) throw new Error(`Failed to fetch token data.`)

        if(tokenData.native) {
            const { decimals, symbol, name } = tokenData;
            const nativeCurrency = new NativeCurrency(chainId, decimals, symbol, name);
            return { token: nativeCurrency, decimals, symbol, name };
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
//     chain: 'sepolia',
//     symbol: 'WETH'
// }).then(res => console.log(res))

module.exports = {
    fetchToken
}   