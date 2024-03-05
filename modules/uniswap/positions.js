const { Pool, Position } = require('@uniswap/v3-sdk')
const JSBI = require('jsbi')
const { uniswapGetPoolInfo } = require('./swaps')
const { getProvider } = require('./constants')

/* --------- The sdk provides a Position class used to create local --------- */
/* ---- representations of an onchain position. It is used to create the ---- */
/* ---- calldata for onchain calls to mint or modify an onchain position ---- */


/* --- Ideal for straightforward position creation with known parameters. --- */
/* ----- It offers simplicity and direct control over position details. ----- */
/**
   * Constructs a position for a given pool with the given liquidity
   * @param chain The network of the desired pool
   * @param fromToken The first token
   * @param toToken The second token
   * @param liquidity The amount of liquidity that is in the position
   * @param tickLower The lower tick of the position
   * @param tickUpper The upper tick of the position
   */
const directPosition = async ({
    chain,
    fromToken,
    toToken,
    liquidityAmount,
    tickLower = -100, // 1 tick represents a price change of 0.01%
    tickUpper = 200,
}) => {
    try{
        const provider = await getProvider(chain)
        console.log({
            provider,
            fromToken,
            toToken,
        })
        /* ---------------- For which pool the liquidity is assigned ---------------- */
        const {token0,token1, fee, liquidity, sqrtPriceX96, tick} = await uniswapGetPoolInfo({
            provider,
            fromToken,
            toToken,
        })
        const pool = new Pool(token0,token1, fee, sqrtPriceX96, liquidity, tick)
        // const liquidity = JSBI.BigInt(liquidityAmount)

        const position = new Position({
            pool,
            liquidity: liquidityAmount,
            tickLower,
            tickUpper
        })

        return position
    }catch(err){
        console.error(err)
        return {
            success: false,
            data: err.message
        }
    }
}

// directPosition({
//     chain: "sepolia",
//     fromToken: "WETH",
//     toToken: "USDT",
//     liquidityAmount: 100000000000,
// }).then(res => console.log(res))