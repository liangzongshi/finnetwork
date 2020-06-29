require('dotenv').config()

const DB = require('./db')
const db = new DB()

const Redis = require("ioredis")
const redis = new Redis()

var faker = require('faker')

const gg = require('./otp')
const tree = require('./tree')
const {random} = require('./util')
const airdrop = require('./airdrop')
const group = require('./group')
const {add_wallet, send, deposit, swapin, swapout, switchs} = require('./wallet')
const {changeBalanceWallet} = require('./func')

const root = {
    first_name: 'Root',
    last_name: 'Root',
    email: 'root@digigo.org',
    hash_password: 'ed39921021b8616f969966d1be1cd32a9105fdd452dc7ffe7e371c5d450b265c',
    city: 'ha noi'
}

const init = async () => {
    await redis.set('index_wallet', 1)
    await redis.set('profitDay', 0)
    await db.admin({
        nowId: process.env.root_Id
    })

    await add_wallet(100000)
    await db.user({id: 100000}, {
        $set: {
            role: 'admin',
            info: root, 
            list_dad: [null, null, null]
        }
    })

    await db.system({})
    console.log('Init Complete')
}

const addUser = async (referral) => {
    var sign = {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: faker.internet.email(),
        hash_password: 'ed39921021b8616f969966d1be1cd32a9105fdd452dc7ffe7e371c5d450b265c',
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
        await changeBalanceWallet(id, 'FFT', 25, 0, 'deposit', tx)
        await changeBalanceWallet(referral, 'FFT', 25, 0, 'deposit', tx)
    }

    await db.user({id: id}, {
        $set: {
            role: 'tester'
        }
    })

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

const randomValue = async (min = 2, max = 4) => {
    const prev = Number(await redis.get('randomValue'))
    const range = random(min, max)
    const mark = random(0, 2)
    if (mark == 1){
        const v = prev * (1 - range / 100)
        await redis.set('randomValue', v)
        return v
    } else {
        const v = prev * (1 + range / 100)
        await redis.set('randomValue', v)
        return v
    }
}

const addOrders = async (number = 102) => {
    for (var i = 0; i < number; i++) {
        console.log(i)
        const coins = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'EOS', 'DASH', 'XLM', 'ETC', 'ATOM', 'XTZ', 'OMG', 'LINK', 'ZRX', 'ALGO']
        const exchan = ['Coinbase', 'Binance', 'Coinbase']
        const bu = exchan[random(0, 2)]
        const pBuy = random(1, 1000)
        const profit = random(1, 100) / 10
        const pSell = pBuy + profit
        const am = random(1, 100000) / 100
        var se
        if (bu == 'Binance'){ se = 'Coinbase'} else { se = 'Binance'}
        await db.system({}, {
            $push: {
                orders: {
                    timestamp: Date.now() + i*5000,
                    type: coins[random(0, 14)],
                    amount: am,
                    buy: {
                        exchanger: bu,
                        price: pBuy
                    },
                    sell: {
                        exchanger: se,
                        price: pSell
                    },
                    profit: am * profit
                }
            }
        })
    }
}

const addDaily = async (pastTime = 92, min = 55, max = 70 ) => {

    const now = Math.floor(Date.now() / 86400000) + 1 //Now_Day

    var ttProfit = 0
    for (var i = pastTime; i >= 1; i--){
        console.log(i)
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

        await redis.set('totalCap', totalCap + valuePay + rest * 30 / 100)
        await redis.set('totalToken', totalToken + valuePay / price )

        const nowPrice = ( totalCap + valuePay + rest * 30 / 100 ) / ( totalToken + valuePay / price )

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

const testTree = async (numberUser = 100, startPriceToken = 0.09, depositRoot = 1200000, capNow = 5000000, randomValue = 90000, tokenBlock = 3642018, totalOrder = 112935612) => {
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

    await redis.set('randomValue', randomValue)
    await redis.set('totalCap', totalCap)
    await redis.set('totalToken', totalToken)

    const totalProfit = await addDaily()

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

const testGroup = async () => {
    const users = await db.user({}, 'id')
    const leaders = users.slice(0,10)
    const members = users.slice(11, 20)
    for (var i = 0; i < leaders.length; i++){
        console.log('Leader: ', leaders[i].id)
        await addLeader(leaders[i].id)
    }

    for (var j = 0; j < members.length; j++){
        console.log('Member',members[j].id)
        await addRoleUser(members[j].id)
    }
}

!(async () => {
    await init()
    await addOrders()
    await testTree()
    await testGroup()
    process.exit()
})()