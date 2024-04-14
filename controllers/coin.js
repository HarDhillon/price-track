const { fetchCoinsFromDatabase, returnCoins } = require('../api/coinApi')
const Coin = require('../models/coin')
const UserCoin = require('../models/user-coin')

exports.getIndex = async (req, res) => {
    try {
        // Get our coins from the coins variable
        const coins = returnCoins()

        let coinData

        if (coins.length > 0) {
            const endPoints = coins.map(coin => {
                return coin.token
            })
            // Join token for the API
            const pairAddresses = endPoints.join(',')

            // Do an initial fetch to get price
            const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/ethereum/' + pairAddresses)
            apiQuery = await response.json()

            // TODO store user coins in a variable when they login to only query once
            user = req.user
            const userCoins = await user.getCoins()

            coinData = apiQuery.pairs.map(coin => {
                let buyPrice = null
                let coinId = null
                // If user holds that coin, set buy price
                userCoins.forEach(item => {
                    if (item.token === coin.pairAddress) {
                        buyPrice = item.userCoin.buyPrice
                        coinId = item.idsdsadsd
                    }
                })

                return {
                    coinName: coin.baseToken.name,
                    coinPrice: coin.priceUsd,
                    coinToken: coin.pairAddress,
                    buyPrice,
                    id: coinId
                }
            })
        }

        res.render('coins/index', {
            pageTitle: 'Retirement Fund',
            coinData: coinData,
            userBuyPrice: ''
        })
    }
    catch (error) {
        next(error)
    }
}

exports.postCoin = async (req, res, next) => {
    const tokenAddress = req.body.tokenAddress
    console.log(tokenAddress)
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/ethereum/' + tokenAddress)
        const coinData = await response.json()

        const name = coinData.pairs[0].baseToken.name
        const token = coinData.pairs[0].pairAddress

        await Coin.create({
            name,
            token
        })

        // Once new coin is creted, we need to repopulate the variable being called in our coinApi
        await fetchCoinsFromDatabase()

        res.redirect('/')
    }
    catch (err) {
        next(err)
    }
}

exports.postBuyCoin = async (req, res) => {

    const { buyPrice, coinToken } = req.body

    try {
        const coin = await Coin.findOne({ where: { token: coinToken } })
        const user = req.user

        await user.addCoin(coin, { through: { buyPrice } })

        res.status(200).redirect('/')

    } catch (err) {
        next(error)
    }
}

exports.deleteBuyPrice = async (req, res) => {
    const { coinId } = req.body
    userId = req.user.id

    try {
        await UserCoin.destroy({
            where: {
                userId: userId,
                coinId: coinId
            }
        })

        res.redirect('/')
    } catch (err) {
        next(error)
    }
}