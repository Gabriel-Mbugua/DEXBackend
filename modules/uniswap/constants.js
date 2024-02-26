const path = require('path')
const { ethers } = require('ethers');
require('dotenv').config({
    path: path.join(__dirname, '../../', './.env'),
});

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const POOL_FACTORY_CONTRACT_ADDRESS ='0x1F98431c8aD98523631AE4a59f267346ea31F984'
const QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

const tokenList = [
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'Wrapped Eth',
        symbol: "WETH",
        contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    },
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'USDT (Tether)',
        symbol: "USDT",
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'Wrapped BTC',
        symbol: "WBTC",
        contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    },
    {
        chainId: 137,
        chain: "Polygon",
        name: 'USDT (Tether)',
        symbol: "USDT",
        contractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    },
    {
        chainId: 137,
        chain: "Polygon",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
    },
    {
        chainId: 56,
        chain: "Binance Smart Chain",
        name: 'USDT (Tether)',
        symbol: "USDT",
        contractAddress: "0x55d398326f99059fF775485246999027B3197955"
    },
    {
        chainId: 56,
        chain: "Binance Smart Chain",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
    },
]

const getChainId = (chainName) => {
    const formattedChainName = chainName.toLowerCase();

    switch (formattedChainName) {
        case 'eth':
        case 'ethereum':
            return 1;
        case 'optimism':
            return 10;
        case 'goerli':
            return 420;
        case 'optimism sepolia': 
            return 11155420;
        case 'arbitrum one':
            return 42161;
        case 'arbitrum goerli':
            return 421613;
        case 'arbitrum sepolia': 
            return 421614;
        case 'matic':
        case 'polygon':
            return 137;
        case 'mumbai':
            return 80001;
        case 'goerli':
            return 5;
        case 'sepolia': 
            return 11155111;
        case 'celo testnet':
            return 44787;
        case 'celo':
            return 42220;
        case 'bsc':
            return 56;
        case 'avalanche':
            return 43114;
        case 'base':
            return 8453;
        case 'base goerli testnet': // Custom testnet
            return 84531;
        default:
            throw new Error(`Unknown chain name: ${chainName}`);
    }
}

const getRpcUrl = (chainName) => {
    try{
        const formattedChainName = chainName.toLowerCase();

        switch (formattedChainName) {
            case 'eth':
            case 'ethereum':
                return `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
            case 'goerli':
                return `https://goerli.infura.io/v3/${INFURA_API_KEY}`;
            case 'arbitrum one':
                return `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`;
            case 'arbitrum goerli':
                return `https://arbitrum-goerli.infura.io/v3/${INFURA_API_KEY}`;
            case 'matic':
            case 'polygon':
                return `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`;
            case 'mumbai':
                return `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}}`
            case 'celo testnet':
                return `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;
            case 'celo':
                return `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`;
            case 'avalanche':
                return `https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}`;
            default:
                throw new Error(`Unknown chain name: ${chainName}`);
        }
    }catch(err){
        console.error(err);
        throw new Error(`Unknown chain name: ${chainName}`);
    }
}

const getProvider = async (chain) => {
    try{
        const rpcUrl = getRpcUrl(chain)
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        return provider
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}
// getProvider("eth").then(res => console.log(res))

module.exports ={ 
    getChainId,
    getRpcUrl,
    tokenList,
    getProvider,
    QUOTER_CONTRACT_ADDRESS,
    POOL_FACTORY_CONTRACT_ADDRESS,
}