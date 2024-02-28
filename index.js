const { uniswapGetDirectQuote, uniswapExecuteTrade, uniswapExecuteSmartRoute } = require("./modules/uniswap/swaps");
const PRIVATE_KEY= process.env.PRIVATE_KEY



// uniswapGetDirectQuote({ from: 'USDT', to: 'WETH', chain: "ethereum", fromAmount: '4000' }).then(res => console.log(res))

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