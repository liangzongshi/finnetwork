require('dotenv').config()

const DB = require('./db')
const db = new DB()

const Redis = require("ioredis")
const redis = new Redis()

const Binance = require('binance-api-node').default
const bnb = new Binance()

var faker = require('faker')

const gg = require('./otp')
const tree = require('./tree')
const {random} = require('./util')
const {add_wallet, send, deposit, swapin, swapout, switchs} = require('./wallet')

const addDaily = async (numberDay) => {
    const sttDay = Math.floor(Date.now() / 86400000)
    for (var i = numberDay; i >= 1; i--) {
        console.log(i)
        await db.system({}, {
            $push: {
                profitDaily: {
                    value: 50000,
                    timestamp: (sttDay - i) * 86400000
                },
                pay: {
                    value: 30000,
                    timestamp: (sttDay - i) * 86400000
                },
                price: [(sttDay - i) * 86400000, 1]
            }
        })
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

const actionWallet = async (id, type, amount, symbol, to) => {
    
}

const aaa = async () => {
    await deposit(100000, 'FFT', 1000)
    for (var i = 0; i < 3; i++){
        const id = await addUser( await randomId(i,i))
        await deposit(id, 'FFT', 1000)
    }
    await tree.pay_order(1000)
}

const getHistoryData = async (pastTime) => {
    const data = []
    const now = Math.floor(Date.now() / 86400000) + 1 //Now_Day
    for (var i = pastTime; i >= 1; i--){
        const numDay = now - i
        const startDay = (now - i -1) * 86400 * 1000
        const endDay = (now - i) * 86400 * 1000 -1

        const dataDay = await bnb.aggTrades({
            symbol: 'BTCUSDT',
            startTime: startDay,
            endTime: endDay 
        })

        console.log(dataDay)
    }
}
!(async () => {
    await aaa()
    // await getHistoryData(1)
    const dataDay = await bnb.aggTrades({
        symbol: 'BTCUSDT',
        startTime: 1593212400000,
        endTime: 1593215999999 
    })
    console.log(dataDay)
    // process.exit()
})()