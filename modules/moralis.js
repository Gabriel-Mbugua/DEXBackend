const Moralis = require('moralis').default
const path = require('path')
require('dotenv').config({
    path: path.join(__dirname, '../', './.env'),
});

const API_KEY = process.env.MORALIS_API_KEY

const getTokenBySymbol = async ({ symbol, chain }) => {
    try{
        await Moralis.start({ apiKey: API_KEY});

        const response = await Moralis.EvmApi.token.getTokenMetadataBySymbol({
            chain,
            symbols: [symbol]
        });

        console.log(Object.keys(response))

        if(!response.jsonResponse) throw new Error(`Failed to fetch tokens`)

        console.log(`Found ${response.jsonResponse.length} tokens with symbol ${symbol}`)

        return response.jsonResponse
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}

// getTokenBySymbol({ symbol: "USDT", chain: '0x1'})
// .then(res => console.log(JSON.stringify(res)))
// .catch(err => console.log(err))