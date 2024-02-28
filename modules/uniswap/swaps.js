const { FeeAmount, Route, Pool, SwapQuoter, computePoolAddress, Trade, SwapOptions } = require('@uniswap/v3-sdk')
const { CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core')
const { AlphaRouter, ChainId, SwapOptionsSwapRouter02, SwapType } = require('@uniswap/smart-order-router')
const { ethers, BigNumber } = require('ethers');
const JSBI = require('jsbi')
const { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS, getProvider, SWAP_ROUTER_ADDRESS, getChainId, V3_SWAP_ROUTER_ADDRESS } = require('./constants')
const { fetchToken } = require('./tokens')
const ERC20_ABI = require('../abi/erc20.json')
const PRIVATE_KEY= process.env.PRIVATE_KEY

/* ----------------------------------- ABI ---------------------------------- */
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const { toReadableAmount, fromReadableAmount, fromReadableAmountToSmalletUnit } = require('./conversions');

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
        /* ------- gives us the calldata needed to make the call to the Quoter ------ */
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
            readableAmountOut,
            calldata
        }
    }catch(err){
        console.error(err)
        throw err
    }
}

const sendTransaction = async ({
    signer,
    transaction,
    provider
}) => {
    try{
        if (transaction.value) transaction.value = BigNumber.from(transaction.value)
        const txRes = await signer.sendTransaction(transaction)
    
        let receipt = null
    
        while (receipt === null) {
            try {
                receipt = await provider.getTransactionReceipt(txRes.hash)
        
                if (receipt === null) continue
            } catch (e) {
                console.log(`Receipt error:`, e)
                break
            }
        }
    
        // Transaction was successful if status === 1
        if (receipt) return receipt
        
        throw new Error('Transaction failed')
    } catch(err){
        console.error(err)
        throw new Error(err)
    }
}

const getTokenTransferApproval = async ({
    token,
    amount,
    provider,
    signer
}) => {
    try {
        const tokenContract = new ethers.Contract(
            token.token.address,
            ERC20_ABI,
            provider
        )
    
        const transaction = await tokenContract.populateTransaction.approve(
            SWAP_ROUTER_ADDRESS,
            fromReadableAmount(
                amount,
                token.decimals
            ).toString()
        )
    
        return sendTransaction({
            signer,
            provider,
            transaction: {
                ...transaction,
                from: signer.address,
            },
        })
    } catch (err) {
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
        console.log('Initiating trade...')
        const provider = await getProvider(chain)

        const [ fromToken, toToken ] = await Promise.all([
            fetchToken({ chain, symbol: from, provider }),
            fetchToken({ chain, symbol: to, provider })
        ])

        if(!fromToken) throw new Error(`Token ${from} not found`)
        if(!toToken) throw new Error(`Token ${to} not found`)

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

        const { amountOut, readableAmountOut, calldata } = await getOutputQuote({
            swapRoute,
            fromToken,
            fromAmount,
            toToken,
            provider
        })

        console.log({amountOut, readableAmountOut, calldata})

        /* ------------------------ decode the returned quote ----------------------- */
        const quoteCallReturnData = await provider.call({
            to: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
            data: calldata,
        })

        console.log({quoteCallReturnData})
        
        const decodedQuote = ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)

        console.log({decodedQuote})

        /* ---------------------------- create our Trade ---------------------------- */
        const uncheckedTrade = Trade.createUncheckedTrade({
            route: swapRoute,
            inputAmount: CurrencyAmount.fromRawAmount(
              fromToken.token,
              fromReadableAmount(
                fromAmount,
                fromToken.decimals
              )
            ),
            outputAmount: CurrencyAmount.fromRawAmount(
              toToken.token,
              JSBI.BigInt(amountOut)
            ),
            tradeType: TradeType.EXACT_INPUT,
        })

        const signer = new ethers.Wallet(privateKey, provider)

        /* --------- Give the SwapRouter approval to spend our tokens for us -------- */
        const tokenApproval = await getTokenTransferApproval({
            token: fromToken,
            amount: fromAmount,
            signer,
            provider
        })

        console.log({ tokenApproval })


        /* ---- specify time & slippage for our execution and the address to use ---- */
        const options = {
            slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
            deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes from the current Unix time
            recipient: signer.address,
        }

        /* ------ get the associated call parameters for our trade and options ------ */
        const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], options)

        /* --- construct a tx from the method parameters and send the transaction --- */
        const tx = {
            data: methodParameters.calldata,
            to: SWAP_ROUTER_ADDRESS,
            value: methodParameters.value,
            from: signer.address,
            maxFeePerGas: 100_000_000_000,
            maxPriorityFeePerGas: 100_000_000_000,
        }

        console.log(tx)
          
        const response = await signer.sendTransaction(tx)

        return response
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}
// executeTrade({
//     privateKey: PRIVATE_KEY,
//     from: 'USDT', 
//     to: 'WETH', 
//     chain: "ethereum", 
//     fromAmount: '0.01'
// }).then(res => console.log(res))

const executeSmartRoute = async ({
    privateKey,
    from,
    to,
    fromAmount,
    chain
}) => {
    try{
        console.log('Executing smart route...')
        const provider = await getProvider(chain)
        const chainId = getChainId(chain)
        const wallet = new ethers.Wallet(privateKey, provider)

        const [ fromToken, toToken ] = await Promise.all([
            fetchToken({ chain, symbol: from, provider }),
            fetchToken({ chain, symbol: to, provider })
        ])

        if(!fromToken) throw new Error(`Token ${from} not found`)
        if(!toToken) throw new Error(`Token ${to} not found`)
        
        console.log(`Fetching pools for ${fromToken.symbol} and ${toToken.symbol}...`)

        const router = new AlphaRouter({
            chainId,
            provider,
        })

        const options = {
            recipient: wallet.address, // wallet to use
            slippageTolerance: new Percent(50, 10_000), //slippage tolerance
            deadline: Math.floor(Date.now() / 1000 + 1800), //  deadline for the transaction 
            type: SwapType.SWAP_ROUTER_02,
        }

        // create a trade with the currency & the input amount to use to get a quote 
        const rawTokenAmountIn = fromReadableAmountToSmalletUnit(
            fromAmount,
            fromToken.decimals
        )
            
        const route = await router.route(
            CurrencyAmount.fromRawAmount(
                fromToken.token,
                rawTokenAmountIn
            ),
            toToken.token,
            TradeType.EXACT_INPUT,
            options
        )

        if (!route || !route.methodParameters) throw new Error('No route exists.')

        /* --- Give approval to the SwapRouter smart contract to spend our tokens --- */
        const tokenContract = new ethers.Contract(
            fromToken.token.address, 
            ERC20_ABI, 
            wallet
        )

        // We need to wait one block for the approval tx to be included to the blockchain.
        const tokenApproval = await tokenContract.approve(
            V3_SWAP_ROUTER_ADDRESS, 
            ethers.BigNumber.from(rawTokenAmountIn.toString())
        )

        // execute the trade using the route's computed calldata, values, & gas values
        const txRes = await wallet.sendTransaction({
            data: route.methodParameters.calldata,
            to: V3_SWAP_ROUTER_ADDRESS,
            value: route.methodParameters.value,
            from: wallet.address,
            maxFeePerGas: 100_000_000_000,
            maxPriorityFeePerGas: 100_000_000_000,
        })


        return txRes
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}

/* -------------------------------- EXPORTS --------------------------------- */

module.exports = {
    /* --------------------------------- QUOTES --------------------------------- */
    uniswapGetDirectQuote: getDirectQuote,
    /* --------------------------------- TRADES --------------------------------- */
    uniswapExecuteTrade: executeTrade,
    uniswapExecuteSmartRoute: executeSmartRoute,
}