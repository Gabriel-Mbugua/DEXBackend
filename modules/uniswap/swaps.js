const { FeeAmount, Route, Pool, SwapQuoter, computePoolAddress } = require('@uniswap/v3-sdk')
const { CurrencyAmount, TradeType } = require('@uniswap/sdk-core')
const { ethers } = require('ethers');
const { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS, getProvider } = require('./constants')
const { fetchToken } = require('./tokens')

/* ----------------------------------- ABI ---------------------------------- */
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const { toReadableAmount, fromReadableAmount } = require('./conversions');

const getPoolInfo = async ({
    provider,
    fromToken,
    toToken
}) => {
    try{
        const request = {
            factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
            tokenA: fromToken.token,
            tokenB: toToken.token,
            fee: FeeAmount.MEDIUM,
        }

        /* ---------------- Fetch the deployment address of the pair ---------------- */
        const currentPoolAddress = await computePoolAddress(request)

        const poolContract =  new ethers.Contract(
            currentPoolAddress,
            IUniswapV3PoolABI.abi,
            provider
        )

        let [token0, token1, fee, liquidity, slot0] = await Promise.all([
            poolContract.token1(),
            poolContract.token0(),
            poolContract.fee(),
            poolContract.liquidity(),
            poolContract.slot0(),
        ])

        return {
            token0,
            token1,
            fee, // The fee that is taken from every swap that is executed on the pool in 1 per million
            liquidity, // The amount of liquidity the Pool can use for trades at the current price.
            sqrtPriceX96: slot0[0], // The current Price of the pool, encoded as a ratio between token0 and token1.
            tick: slot0[1], // The tick at the current price of the pool.
        }
    }catch(err){
        console.error(err)
        throw err
    }
}

const getDirectQuote = async ({ 
    to, 
    from, 
    chain,
    fromAmount, 
}) => {
    try{
        console.log(`Generating quote...`)
        console.time('FetchQuote')
        const provider = await getProvider(chain)

        const [ fromToken, toToken ] = await Promise.all([
            fetchToken({ chain, symbol: from, provider }),
            fetchToken({ chain, symbol: to, provider })
        ])

        const [poolInfo, quoterContract] = await Promise.all([
            /* ------------- Construct the pool contract to interact with it ------------ */
            getPoolInfo({
                provider,
                fromToken,
                toToken
            }),
            /* ------------ Construct the quote contract to interact with it ------------ */
            new ethers.Contract(
                QUOTER_CONTRACT_ADDRESS,
                Quoter.abi,
                provider
            )
        ])

        const amountInCorrectUnit = ethers.utils.parseUnits(fromAmount, fromToken.decimals);
        const feeAmount = (fromAmount * poolInfo.fee) / 1_000_000;
        const feePercentage = poolInfo.fee / 10_000

        console.log({ feeAmount, feePercentage })

        /* -------------- given the amount you want to swap, produces a ------------- */
        /* ---------- quote for the amount out for a swap of a single pool ---------- */
        // const signer = new ethers.Wallet('0x7722248b8449125e1eea189b3ed289a1438803b5307b585047edfd3b2a9a8022', provider);
        let quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
            poolInfo.token0,
            poolInfo.token1,
            poolInfo.fee,
            amountInCorrectUnit,
            0
        )

        quotedAmountOut = toReadableAmount(quotedAmountOut, toToken.decimals)
        liquidity = toReadableAmount(poolInfo.liquidity, toToken.decimals)

        console.timeEnd('FetchQuote')
        return {
            feeAmount,
            liquidity,
            feePercentage,
            quotedAmountOut
        }
    }catch(err){
        console.time('FetchQuote')
        console.error(err)
        throw new Error(err)
    }
}

// getQuote({ from: 'USDT', to: 'WETH', chain: "ethereum", fromAmount: '3170' }).then(res => console.log(res))

const getOutputQuote = async ({
    fromToken,
    fromAmount,
    swapRoute,
    toToken,
    provider
}) => {
    try{
        const { calldata } = await SwapQuoter.quoteCallParameters(
            swapRoute,
            CurrencyAmount.fromRawAmount(
                fromToken.token,
                fromReadableAmount(
                    fromAmount,
                    fromToken.decimals
                ).toString()
            ),
            TradeType.EXACT_INPUT,
            {
            useQuoterV2: true,
            }
        )

        console.log({calldata})
        
        const quoteCallReturnData = await provider.call({
            // to: QUOTER_CONTRACT_ADDRESS,
            to: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
            data: calldata,
        })
        
        console.log({quoteCallReturnData})

        const amountOut = ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData) 

        const readableAmountOut = toReadableAmount(amountOut[0], toToken.decimals)

        return {
            amountOut,
            readableAmountOut
        }
    }catch(err){
        console.error(err)
        throw err
    }
}

const executeTrade = async ({
    privateKey,
    from,
    to,
    fromAmount,
    chain
}) => {
    try{
        const provider = await getProvider(chain)

        const [ fromToken, toToken ] = await Promise.all([
            fetchToken({ chain, symbol: from, provider }),
            fetchToken({ chain, symbol: to, provider })
        ])

        const { sqrtPriceX96, tick, liquidity, fee } = await getPoolInfo({
            provider,
            fromToken,
            toToken
        })

        const pool = new Pool(
            fromToken.token,
            toToken.token,
            FeeAmount.MEDIUM,
            sqrtPriceX96.toString(),
            liquidity.toString(),
            tick
        )

        const swapRoute = new Route(
            [pool],
            fromToken.token,
            toToken.token
        )

        const { amountOut, readableAmountOut } = await getOutputQuote({
            swapRoute,
            fromToken,
            fromAmount,
            toToken,
            provider
        })

        // const signer = new ethers.Wallet(privateKey, provider)

        return amountOut
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}

// executeTrade({
//     privateKey: "0xb0157fe943204352e42552b9519b551238e35afc4cf0808842d522ae9af6c62a",
//     from: 'USDT', 
//     to: 'WETH', 
//     chain: "ethereum", 
//     fromAmount: '4000'
// }).then(res => console.log(res))

module.exports = {
    uniswapGetDirectQuote: getDirectQuote
}