const { computePoolAddress } = require('@uniswap/v3-sdk')
const { FeeAmount } = require('@uniswap/v3-sdk')
const { ethers } = require('ethers');
const { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS, getProvider } = require('./constants')
const { fetchToken } = require('./tokens')

/* ----------------------------------- ABI ---------------------------------- */
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const { toReadableAmount } = require('./conversions');

const getPoolConstants = async () => {
    try{

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
        console.time('FetchQuote')
        const provider = await getProvider(chain)

        const [ fromToken, toToken ] = await Promise.all([
            fetchToken({ chain, symbol: from, provider }),
            fetchToken({ chain, symbol: to, provider })
        ])

        const request = {
            factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
            tokenA: fromToken.token,
            tokenB: toToken.token,
            fee: FeeAmount.MEDIUM,
        }

        /* ---------------- Fetch the deployment address of the pair ---------------- */
        const currentPoolAddress = await computePoolAddress(request)

        const [poolContract, quoterContract] = await Promise.all([
            /* ------------- Construct the pool contract to interact with it ------------ */
            new ethers.Contract(
                currentPoolAddress,
                IUniswapV3PoolABI.abi,
                provider
            ),
            /* ------------ Construct the quote contract to interact with it ------------ */
            new ethers.Contract(
                QUOTER_CONTRACT_ADDRESS,
                Quoter.abi,
                provider
            )
        ])

        let [token0, token1, fee, liquidity, slot0] = await Promise.all([
            poolContract.token1(),
            poolContract.token0(),
            poolContract.fee(),
            poolContract.liquidity(),
            poolContract.slot0(),
        ])

        const amountInCorrectUnit = ethers.utils.parseUnits(fromAmount, fromToken.decimals);

        /* -------------- given the amount you want to swap, produces a ------------- */
        /* ---------- quote for the amount out for a swap of a single pool ---------- */
        // const signer = new ethers.Wallet('0x7722248b8449125e1eea189b3ed289a1438803b5307b585047edfd3b2a9a8022', provider);
        let quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
            token0,
            token1,
            fee,
            amountInCorrectUnit,
            0
        )

        quotedAmountOut = toReadableAmount(quotedAmountOut, toToken.decimals)
        liquidity = toReadableAmount(liquidity, toToken.decimals)

        console.timeEnd('FetchQuote')
        return {
            liquidity,
            quotedAmountOut
        }
    }catch(err){
        console.time('FetchQuote')
        console.error(err)
        throw new Error(err)
    }
}

// getQuote({ from: 'USDT', to: 'WETH', chain: "ethereum", fromAmount: '3170' }).then(res => console.log(res))

module.exports = {
    uniswapGetDirectQuote: getDirectQuote
}