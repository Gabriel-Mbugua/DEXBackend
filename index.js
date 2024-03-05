const { uniswapFee } = require("./modules/uniswap/constants");
const { uniswapGetDirectQuote, uniswapExecuteTrade, uniswapExecuteSmartRoute } = require("./modules/uniswap/swaps");
const PRIVATE_KEY= process.env.PRIVATE_KEY



// uniswapGetDirectQuote({ 
//     from: 'USDT', 
//     to: 'WETH', 
//     chain: "polygon", 
//     fromAmount: '4000',
//     requestFee: uniswapFee.medium
// }).then(res => console.log(res))
// uniswapGetDirectQuote({ 
//     from: 'USDT', 
//     to: 'WETH', 
//     chain: "arb", 
//     fromAmount: '4000',
//     requestFee: uniswapFee.low
// }).then(res => console.log(res))

// getPool("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", 3000)

// uniswapExecuteTrade({
//     privateKey: PRIVATE_KEY,
//     from: 'USDT', 
//     to: 'WETH', 
//     chain: "ethereum", 
//     fromAmount: '0.01'
// }).then(res => console.log(res))

// uniswapExecuteSmartRoute({
//     privateKey: PRIVATE_KEY,
//     from: 'WETH', 
//     to: 'USDT', 
//     chain: "sepolia", 
//     fromAmount: '0.01'
// }).then(res => console.log(res))