require('dotenv').config()

const DB = require('./db')
const db = new DB()

const Redis = require("ioredis")
const redis = new Redis()

const Binance = require('binance-api-node').default
const bnb = new Binance()

const Coinbase = require('coinbase-pro')
const cb = new Coinbase.PublicClient()

var faker = require('faker')

const gg = require('./otp')
const tree = require('./tree')
const {random} = require('./util')
const airdrop = require('./airdrop')
const group = require('./group')
const {add_wallet, send, deposit, swapin, swapout, switchs} = require('./wallet')

const getHistoryBnb = async (symbol, pastTime) => {
    const data = []
    const now = Math.floor(Date.now() / 86400000) + 1 //Now_Day
    for (var i = pastTime; i >= 1; i--){

        const startDay = (now - i -1) * 86400 * 1000
        const endDay = (now - i) * 86400 * 1000 -1

        for ( var j = startDay; j < endDay; j += 3600 * 1000){
            const bnbData = await bnb.aggTrades({
                symbol: `${symbol}USDT`,
                startTime: j,
                endTime: j + 3600 * 1000 - 1
            })

            
            // console.log(bnbData.length)
            // for (var k = 0; k < bnbData.length -1; k++){
            //     if (bnbData[k].timestamp !== bnbData[k+1].timestamp){
            //         if (bnbData[k].quantity > 1){
            //         console.log(bnbData[k])
            //         }
            //     }
            // }
        }
    }
}

const addUser = async (referral) => {
    var sign = {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: faker.internet.email(),
        hash_password: '',
        referral: referral
    }

    var nowId = Number((await db.admin({role: 'admin'}, 'nowId'))[0].nowId)
    var seed = Number(random(1,8))
    var id = nowId + seed
    await db.admin({role: 'admin'}, {$inc: {nowId: seed}})
    await add_wallet(id)

    var referral = String(sign.referral)
    const dad = await db.user({id: referral}, 'id')
    if (dad.length == 0){
        referral = process.env.root_Id
    }
    await tree.add_node(id, referral, sign)
    await gg.add(id)

    if (referral !== process.env.root_Id){
        const tx = {
            type: 'deposit',
            value: 25,
            symbol: 'FFT',
            address: process.env.fft_at,
            hash: 'Pay Airdrop'
        }
        // await changeBalanceWallet(id, 'FFT', 25, 0, 'deposit', tx)
        // await changeBalanceWallet(referral, 'FFT', 25, 0, 'deposit', tx)
    }

    return id
}

const fullUser = async () => {
    const users = await db.user({}, 'id')
    var res = []
    users.forEach( user => {
        res.push(user.id)
    })
    return res
}

const randomId = async (start = 0, end = -1) => {
    const listId = await fullUser()
    var to = end
    if (end == -1){
        to = listId.length - 1
    }
    const numberId = random(start, to)
    return listId[numberId]
}

const addLeader = async (id, city='ha noi') => {
    await db.user({id: id}, {
        $set: {
            'info.kyc': true,
            'airdrop.complete': true,
            'airdrop.members': 51,
            'info.city': city
        }
    })

    await group.new(id)
}

const randomValue = async (min = 10, max = 60) => {
    const prev = Number(await redis.get('randomValue'))
    const range = random(min, max)
    const mark = random(0, 1)
    if (mark == 0){
        const v = prev * (1 - range / 100)
        await redis.set('randomValue', v)
        return v
    } else {
        const v = prev * (1 + range / 100)
        await redis.set('randomValue', v)
        return v
    }
}

const addOrders = async (numberDay) => {
    const sttDay = Math.floor(Date.now() / 86400000)
    for (var i = numberDay; i >= 1; i--) {
        console.log(i)
        await db.system({}, {
            $push: {
                orders: {
                    timestamp: (sttDay - i) * 86400000,
                    type: 'BTC',
                    amount: 1,
                    buy: {
                        exchanger: 'Binance',
                        price: 10000
                    },
                    sell: {
                        exchanger: 'Binance',
                        price: 9000
                    },
                    profit: 1000
                }
            }
        })
    }
}

const addDaily = async (pastTime = 92, min = 45, max = 70 ) => {

    const now = Math.floor(Date.now() / 86400000) + 1 //Now_Day

    var ttProfit = 0
    console.log('AAA')
    for (var i = pastTime; i >= 1; i--){
        const startDay = (now - i -1) * 86400 * 1000
        const endDay = (now - i) * 86400 * 1000 -1

        const valueProfit = await randomValue()
        ttProfit += valueProfit

        const rate = random(min, max)
        const valuePay = valueProfit * rate / 100
        
        const rest = valueProfit - valuePay

        const totalCap = Number(await redis.get('totalCap'))
        const totalToken = Number(await redis.get('totalToken'))
        const price = totalCap / totalToken

        console.log(totalCap, totalToken, price)
        await redis.set('totalCap', totalCap + valuePay + rest * 30 / 100)
        await redis.set('totalToken', totalToken + valuePay / price )

        console.log(totalCap + valuePay + rest * 30 / 100, totalToken + valuePay / price)

        const nowPrice = ( totalCap + valuePay + rest * 30 / 100 ) / ( totalToken + valuePay / price )

        console.log(nowPrice)
        await db.system({}, {
            $push: {
                profitDaily: {
                    value: valueProfit,
                    timestamp: endDay
                },
                pay: {
                    value: valuePay,
                    timestamp: endDay
                },
                price: [ endDay, Number(nowPrice.toFixed(4))]
            }
        })
    }

    return ttProfit
}

const addRoleUser = async (id, city = 'ha noi') => {
    await db.user({id: id}, {
        $set: {
            'info.kyc': true,
            'airdrop.complete': true,
            'info.city': city
        }
    })
}

const testTree = async (numberUser = 100, startPriceToken = 0.09, depositRoot = 1200000, capNow = 5000000, randomValue = 70000, tokenBlock = 3642018, totalOrder = 112935612) => {
    await deposit(100000, 'FFT', depositRoot)
    const tokenNow = capNow / startPriceToken - depositRoot

    var totalToken = depositRoot
    var totalCap = depositRoot * startPriceToken

    for (var i = 0; i < numberUser; i++){
        console.log(i)
        const id = await addUser( await randomId())
        const depo = Number(random( Number((tokenNow * 0.7 / numberUser).toFixed(0)), Number((tokenNow * 1.3 / numberUser).toFixed(0)) ))

        totalToken += depo
        totalCap += depo * startPriceToken
        await deposit(id, 'FFT', depo)
    }

    console.log(totalCap, totalToken)
    await redis.set('randomValue', randomValue)
    await redis.set('totalCap', totalCap)
    await redis.set('totalToken', totalToken)

    console.log('OK')
    const totalProfit = await addDaily()
    // console.log(totalProfit)
    await db.system({}, {
        $set: {
            totalFund: Number(await redis.get('totalCap')),
            totalToken: Number(await redis.get('totalToken')),
            tokenBlock: tokenBlock,
            totalOrder: totalOrder,
            totalProfit: totalProfit
        }
    })
}

!(async () => {
    await testTree()
    process.exit()
})()