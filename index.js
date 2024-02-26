const { uniswapGetDirectQuote } = require("./modules/uniswap/swaps");



uniswapGetDirectQuote({ from: 'USDT', to: 'WETH', chain: "ethereum", fromAmount: '3170' }).then(res => console.log(res))