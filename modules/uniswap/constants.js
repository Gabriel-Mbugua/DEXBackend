const path = require('path')
const { FeeAmount } = require('@uniswap/v3-sdk')
const { ethers } = require('ethers');
require('dotenv').config({
    path: path.join(__dirname, '../../', './.env'),
});

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'

const tokenList = [
    /* ----------------------------------- ETH ---------------------------------- */
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'Eth',
        symbol: "ETH",
        decimals: 18,
        native: true,
        contractAddress: '0x',
    },
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
        contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7"
    },
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    },
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'Wrapped BTC',
        symbol: "WBTC",
        contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    },
    {
        chainId: 1,
        chain: "Ethereum",
        name: 'Ether',
        symbol: "ETH",
        contractAddress: "NATIVE" // Indicative value to denote native token
    },
    /* --------------------------------- SEPOLIA -------------------------------- */
    {
        chainId: 11155111,
        chain: "Sepolia",
        name: 'Wrapped Eth',
        symbol: "WETH",
        contractAddress: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"
    },
    {
        chainId: 11155111,
        chain: "Sepolia",
        name: 'USDT',
        symbol: "USDT",
        contractAddress: "0xe8888fe3bde6f287bdd0922bea6e0bf6e5f418e7"
    },
    {
        chainId: 11155111,
        chain: "Sepolia",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0xbe72e441bf55620febc26715db68d3494213d8cb"
    },
    /* --------------------------------- POLYGON -------------------------------- */
    {
        chainId: 137,
        chain: "Polygon",
        name: 'Wrapped Eth',
        symbol: "WETH",
        contractAddress: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
    },
    {
        chainId: 137,
        chain: "Polygon",
        name: 'Matic Token',
        symbol: "MATIC",
        contractAddress: "NATIVE" // Indicative value to denote native token
    },
    {
        chainId: 137,
        chain: "Polygon",
        name: 'USDT (Tether)',
        symbol: "USDT",
        contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
    },
    {
        chainId: 137,
        chain: "Polygon",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
    },
    /* -------------------------------- ARBITRUM -------------------------------- */
    {
        chainId: 42161,
        chain: "Arbitrum",
        name: 'Wrapped Eth',
        symbol: "WETH",
        contractAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"
    },
    {
        chainId: 42161,
        chain: "Arbitrum",
        name: 'USDT (Tether)',
        symbol: "USDT",
        contractAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
    },
    {
        chainId: 42161,
        chain: "Arbitrum",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
    },
    /* -------------------------------- OPTIMISM -------------------------------- */ 
    {
        chainId: 10,
        chain: "Optimism",
        name: 'Wrapped Eth',
        symbol: "WETH",
        contractAddress: "0x4200000000000000000000000000000000000006"
    },
    {
        chainId: 10,
        chain: "Optimism",
        name: 'USDT (Tether)',
        symbol: "USDT",
        contractAddress: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58"
    },
    {
        chainId: 10,
        chain: "Optimism",
        name: 'USDC (Circle)',
        symbol: "USDC",
        contractAddress: "0x7f5c764cbc14f9669b88837ca1490cca17c31607"
    },   
]

const uniswapFee = {
    lowest: FeeAmount.LOWEST,
    low: FeeAmount.LOW,
    medium: FeeAmount.MEDIUM,
    high: FeeAmount.HIGH
}

const getChainId = (chainName) => {
    const formattedChainName = chainName.toLowerCase();

    switch (formattedChainName) {
        case 'eth':
        case 'ethereum':
            return 1;
        case 'ganache':
            return 5777;
        case 'optimism':
            return 10;
        case 'goerli':
            return 420;
        case 'optimism sepolia': 
            return 11155420;
        case 'arb':
        case 'arbitrum':
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

const getUniswapDeploymentAddress = (chainName) => {
    const formattedChainName = chainName.toLowerCase();

    switch (formattedChainName) {
        case 'eth':
        case 'ethereum':
            return 1;
        case 'ganache':
            return 5777;
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
                // return `127.0.0.1:7545`
            case 'goerli':
                return `https://goerli.infura.io/v3/${INFURA_API_KEY}`
            case 'sepolia':
                return `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
            case 'ganache':
                return `http://127.0.0.1:7545`;
            case 'arb':
            case 'arbitrum':
                return `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`;
            case 'optimism':
                return `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`;
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

const getUniswapV3FactoryContract = (chainName) => {
    try{
        const formattedChainName = chainName.toLowerCase();

        switch (formattedChainName) {
            case 'eth':
            case 'ethereum':
            case 'goerli':
            case 'polygon':
            case 'matic':
            case 'optimism':
            case 'arb':
            case 'arbitrum':
                return `0x1F98431c8aD98523631AE4a59f267346ea31F984`
            case 'celo':
                return `0xAfE208a311B21f13EF87E33A90049fC17A7acDEc`;
            case 'sepolia':
                return `0x0227628f3F023bb0B980b67D528571c95c6DaC1c`
            case 'bsc':
                return `0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7`;
            default:
                throw new Error(`Unsupported chain: ${chainName}`);
        }
    }catch(err){
        console.error(err);
        throw new Error(`Unknown chain: ${chainName}`);
    }
}


const getUniswapQuoterContract = (chainName) => {
    try{
        const formattedChainName = chainName.toLowerCase();

        switch (formattedChainName) {
            case 'eth':
            case 'ethereum':
            case 'goerli':
            case 'polygon':
            case 'matic':
            case 'optimism':
            case 'arb':
            case 'arbitrum':
                return `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6`
            case 'celo':
                return `0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8`;
            case 'sepolia':
                return `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6`
            case 'bsc':
                return `0x78D78E420Da98ad378D7799bE8f4AF69033EB077`;
            default:
                throw new Error(`Unsupported chain: ${chainName}`);
        }
    }catch(err){
        console.error(err);
        throw new Error(`Unknown chain: ${chainName}`);
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
// getProvider("sepolia").then(res => console.log(res))

module.exports ={ 
    getChainId,
    getRpcUrl,
    uniswapFee,
    tokenList,
    getProvider,
    getUniswapV3FactoryContract,
    getUniswapQuoterContract,
    QUOTER_CONTRACT_ADDRESS,
    SWAP_ROUTER_ADDRESS,
    V3_SWAP_ROUTER_ADDRESS,
}