require('dotenv').config()

const Redis = require("ioredis")
const redis = new Redis()

const R = require('ramda')

const DB = require('./db')
const db = new DB()

const tree = require('./tree')
const {randStr} = require('./util')
const {insufficient, addressToId, minus, changeBalanceWallet, findId, rate, getPrice, idToAddress } = require('./func')

//ETH
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws/v3/95d96f6402fa41459347dd947e59d900'))
const {toWallet} = require('send-ether-fix')
const FlexEther = require('flex-ether-fix')
const FlexContract = require('flex-contract-fix')

//BTC
const bip39 = require('bip39')
const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')
const MyWallet = require('blockchain.info/MyWallet')
const Receive = require('blockchain.info/Receive')

//BNB
const BncClient = require('@binance-chain/javascript-sdk')
const WebSocket = require('ws')
const axios = require('axios')

const fees = async (id, symbol) => {
    const p = await getPrice(symbol)
    const dwFee = (await tree.limit(id)).dwFee
    return (dwFee / p).toFixed(6)
}

class BTC {
    constructor(){
        this.wallet = new MyWallet(process.env.bcinfo_id, process.env.bcinfo_pass, { 
            apiCode: process.env.bcinfo_api, 
            apiHost: process.env.bcinfo_host 
        })
        this.receive = new Receive(process.env.bcinfo_xpub, process.env.bcinfo_hook, process.env.bcinfo_api,{
             __unsafe__gapLimit: 1000
        })
    }

    hd = (index) => {
        const seed = bip39.mnemonicToSeedSync(process.env.mnemonic)
        const root = bip32.fromSeed(seed)
        const child = root.derivePath("m/44'/0'/0'/0/"+index)
        const Address = bitcoin.payments.p2pkh({ pubkey: child.publicKey }).address
        return {address: Address, index: index, key: child.toWIF()}
    }

    //DONE
    add = async (id) => {
        // const res = await this.receive.generate({secret: process.env.bcinfo_sr})
        const res = this.hd(await redis.get('index_wallet'))
        await redis.incr('index_wallet')

        await redis.sadd('received_btc', res.address)
        await db.user({
            id: id,
            index: res.index,
            currency: [{
                address: res.address,
                coin: 'Bitcoin',
                logo: '/assets/coin/btc.png',
                symbol: 'BTC',
                balance: 0,
                to_swap: [{
                    coin: 'FinFine',
                    symbol: 'FFT'
                }]
            }]
        })
        return {
            index: res.index,
        }
    }

    //DONE
    send = async (to, amount, id, memo) => {
        amount = Number(amount)
        if ( (await redis.get(id)) == null ) {
            await redis.set(id, 'locked')
            await redis.expire(id, 15)

            if ( await insufficient(id, 'BTC', amount) ) {
                console.log('this')
                const fee = await fees(id, 'BTC')
                const txs = await this.wallet.send(to, ((amount - fee) * 10**8).toFixed(0), { from: 0, feePerByte: 6})
                var tx = {
                    hash: txs.tx_hash,
                    address: to,
                    value: amount - fee,
                    symbol: 'BTC',
                    type: 'withdraw'
                }

                console.log(tx)

                const _amount = await minus(amount, 'withdraw', 'BTC')
                await changeBalanceWallet(id, 'BTC', _amount, 0, 'withdraw', tx)
                return tx
            } else {
                return 'amount'
            }
        }
    }

    //DONE
    hook = () => {
        const conn = new WebSocket('wss://ws.blockchain.info/inv')
        conn.on('open', () => {
            conn.send("{'op':'unconfirmed_sub'}")
        })
    
        conn.on('message', async (event) => {
            var ev = JSON.parse(event)
            const outputs = ev.x.out

            const mb = await redis.smembers('received_btc')

            const filter = outputs.filter(output => mb.includes(output.addr))

            if (filter.length !== 0){
                var tx = {
                    hash: ev.x.hash,
                    value: Number(filter[0].value) / 10**8,
                    address: filter[0].addr,
                    symbol: 'BTC',
                    type: 'deposit'
                }

                console.log(tx)

                const fee = await fees( await addressToId(tx.address, 'BTC'), 'BTC')
                const _amount = await minus(amount, 'deposit', 'BTC')
                await changeBalanceWallet(tx.address, 'BTC', _amount, fee, 'deposit', tx)
            }
        })
    }
}

const btc = new BTC()

// Socket
const Esock = new WebSocket(`wss://ws.web3api.io?x-api-key=${process.env.amber_api}&x-amberdata-blockchain-id=ethereum-mainnet`)
Esock.on('open', () => {
    // console.log('Connected Esock')
})

class ETH {
    constructor(){
        this.ether = new FlexEther({
            network: process.env.eth_network,
            infuraKey: process.env.infura,
            providerURI: `https://${process.env.eth_network}.infura.io/v3/${process.env.infura}`,
        })
    }

    add = async (index) => {
        var t =  toWallet({mnemonic: process.env.mnemonic, mnemonicIndex: index})

        setTimeout(() =>{
            Esock.send(JSON.stringify({
                jsonrpc: '2.0',
                method: 'subscribe',
                params: ['address:transactions', {
                    address: t.address
                }],
                id: 1,
            }))
        }, 1000)

        await redis.sadd('received_eth', t.address)
        await db.user({index: index}, {$push: {'currency': {
            symbol: 'ETH',
            coin: 'Ethereum',
            logo: '/assets/coin/eth.png',
            address: t.address,
            balance: 0,
            to_swap: [{
                coin: 'FinFine',
                symbol: 'FFT'
            }]
        }}})
    }

    hd = (index) => toWallet({mnemonic: process.env.mnemonic, mnemonicIndex: index})

    send = async (to, amount, id, memo) => {
        amount = Number(amount)
        if ( (await redis.get(id)) == null ) {
            redis.set(id, 'locked')
            redis.expire(id, 15)
    
            if ( await insufficient(id, 'ETH', amount) ) {
                const fee = await fees(id, 'ETH')
                const hash = (await this.ether.transfer(to, amount - fee, {key: this.hd(1).key.slice(2, this.hd(1).key.length)})).transactionHash
                var tx = {
                    hash: hash,
                    address: to,
                    value: amount - fee,
                    symbol: 'ETH',
                    type: 'withdraw'
                }

                console.log(tx)

                const _amount = await minus(amount, 'withdraw', 'ETH')
                await changeBalanceWallet(id, 'ETH', _amount, 0, 'withdraw', tx)
                return tx
            } else {
                return 'amount'
            }
        }
    }

    transfer = async (amount, index) => {
        console.log(amount, index)
        const to = this.hd(1).address
        const key = this.hd(index).key.slice(2, this.hd(index).key.length)
        console.log(to, key)
        const hash = (await this.ether.transfer( to, Number(amount), {key: key})).transactionHash
        console.log(hash)
    }

    hook = async () => {
        Esock.on('message', async (data) => {
            const res =  JSON.parse(data)
            if (res.id == 1){
                // console.log(data)
            } else {
                const result = res.params.result
                const received_eth = (await redis.smembers('received_eth')).map(v => v.toLowerCase())

                if (received_eth.includes(result.to)){
                    const tx = {
                        hash: result.hash,
                        value: Number(result.value)/ 10**18,
                        address: result.to,
                        symbol: 'ETH',
                        type: 'deposit',
                    }

                    console.log(tx)
   
                    const fee = await fees( await addressToId(tx.address, 'ETH'), 'ETH') 
                    const _amount = await minus(amount, 'deposit', 'ETH')
                    await changeBalanceWallet(tx.address, 'ETH', _amount, fee, 'deposit', tx)

                    // await this.transfer(tx.value - 0.001, index)
                }
            }
        })

        setTimeout( async () =>{
            const addresses = await redis.smembers('received_eth')
            addresses.forEach((address) => {
                Esock.send(JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'subscribe',
                    params: ['address:transactions', {
                        address: address
                    }],
                    id: 1,
                }))
            })
        }, 5000)
    }
}

const eth = new ETH()

class USDT {
    constructor(){
        const provider = new FlexEther({
            network: process.env.eth_network,
            infuraKey: process.env.infura,
            providerURI: `https://${process.env.eth_network}.infura.io/v3/${process.env.infura}`,
        })
        const abi = require('./usdt.json')
        this.contract = new FlexContract(abi, process.env.usdt_at, {
            eth: provider,
        })
        this.ET = new ETH()
    }

    add = async (index) => {
        var t =  toWallet({mnemonic: process.env.mnemonic, mnemonicIndex: index})
        await db.user({index: index}, {$push: {'currency': {
            symbol: process.env.usdt_symbol,
            coin: 'Tether USD (ERC20)',
            logo: '/assets/coin/usdt.png',
            address: t.address,
            balance: 0,
            to_swap: [{
                coin: 'FinFine',
                symbol: 'FFT'
            }]
        }}})
    }
    hd = (index) => toWallet({mnemonic: process.env.mnemonic, mnemonicIndex: index})

    send = async (to, amount, id, memo) => {
        if ( (await redis.get(id)) == null ) {
            redis.set(id, 'locked')
            redis.expire(id, 15)
    
            if ( await insufficient(id, 'USDT', amount) ) {
                const fee = await fees(id, 'USDT')
                let tx = {
                    hash: (await this.contract.transfer(to, ((Number(amount) - fee) * 10**process.env.usdt_dec).toFixed(0), {
                        key: this.hd(index).key.slice(2,this.hd(index).key.length)
                    })).transactionHash,
                    address: to,
                    value: Number(amount) - fee,
                    symbol: process.env.usdt_symbol,
                    type: 'withdraw'
                }

                console.log(tx)

                const _amount = await minus(amount, 'withdraw', 'USDT')
                await changeBalanceWallet(id, 'USDT', _amount, 0, 'withdraw', tx)
                return tx
            } else {
                return 'amount'
            }
        }
    }

    transfer = async (amount, index) => {
        await this.contract.transfer(this.hd(1).address, (Number(amount) * 10**process.env.usdt_dec).toFixed(0), {
            key: this.hd(index).key.slice(2, this.hd(index).key.length)
        })
    }

    hook = () => {
        let watcher = this.contract.Transfer.watch()
        watcher.on('data', async (data) => {
            if ((await redis.smembers('received_eth')).includes(data.args.to)){
                var tx = {
                    hash: data.transactionHash,
                    value: data.args.value / 10**process.env.usdt_dec,
                    address: data.args.to,
                    symbol: process.env.usdt_symbol,
                    type: 'deposit'
                }

                console.log(tx)

                const fee = await fees( await addressToId(tx.address, 'USDT'), 'USDT') 
                const _amount = await minus(amount, 'deposit', 'USDT')
                await changeBalanceWallet(tx.address, 'USDT', _amount, fee, 'deposit', tx)

                // await this.ET.send(tx.address, 0.001, 100000, ' ')
                // await this.transfer(tx.value, index)
            }
        })
    }
}

const usdt = new USDT()

class FFT {
    constructor(){
        const provider = new FlexEther({
            network: process.env.eth_network,
            infuraKey: process.env.infura,
            providerURI: `https://${process.env.eth_network}.infura.io/v3/${process.env.infura}`,
        })
        const abi = require('./fft.json')
        this.contract = new FlexContract(abi, process.env.fft_at, {
            eth: provider,
        })
        this.ET = new ETH()
    }

    add = async (index) => {
        var t =  toWallet({mnemonic: process.env.mnemonic, mnemonicIndex: index})
        await db.user({index: index}, {$push: {'currency': {
            symbol: process.env.fft_symbol,
            coin: 'FinFine',
            logo: '/assets/coin/fft.png',
            address: t.address,
            balance: 0,
            to_swap: [
                {
                    coin: 'Bitcoin',
                    symbol: 'BTC'
                },
                {
                    coin: 'Ethereum',
                    symbol: 'ETH'
                },
                {
                    coin: 'Tether USD',
                    symbol: 'USDT'
                },
                {
                    coin: 'Binance Coin',
                    symbol: 'BNB'
                }
            ]
        }}})
    }
    hd = (index) => toWallet({mnemonic: process.env.mnemonic, mnemonicIndex: index})

    send = async (to, amount, id, memo) => {

        if ( (await redis.get(id)) == null ) {
            redis.set(id, 'locked')
            redis.expire(id, 15)
    
            if ( await insufficient(id, 'FFT', amount) ) {
                const fee = await fees(id, 'FFT')
                let tx = {
                    hash: (await this.contract.transfer(to, ((Number(amount) - fee) * 10**process.env.fft_dec).toFixed(0), {
                        key: this.hd(index).key.slice(2,this.hd(index).key.length)
                    })).transactionHash,
                    address: to,
                    value: Number(amount) - fee,
                    symbol: process.env.fft_symbol,
                    type: 'withdraw'
                }

                console.log(tx)

                const _amount = await minus(amount, 'withdraw', 'FFT')
                await changeBalanceWallet(id, 'FFT', _amount, 0, 'withdraw', tx)
                return tx
            } else {
                return 'amount'
            }
        }
    }

    transfer = async (amount, index) => {
        await this.contract.transfer(this.hd(1).address, (Number(amount) * 10**process.env.fft_dec).toFixed(0), {
            key: this.hd(index).key.slice(2, this.hd(index).key.length)
        })
    }

    hook = () => {
        let watcher = this.contract.Transfer.watch()
        watcher.on('data', async (data) => {
            if ((await redis.smembers('received_eth')).includes(data.args.to)){
                var tx = {
                    hash: data.transactionHash,
                    value: data.args.value / 10**process.env.fft_dec,
                    address: data.args.to,
                    symbol: process.env.fft_symbol,
                    type: 'deposit'
                }

                console.log(tx)

                const fee = await fees( await addressToId(tx.address, 'FFT'), 'FFT') 
                const _amount = await minus(amount, 'deposit', 'FFT')
                await changeBalanceWallet(tx.address, 'FFT', _amount, fee, 'deposit', tx)

                // await this.ET.send(tx.address, 0.001, 100000, ' ')
                // await this.transfer(tx.value, index)

                await tree.pay_swap_depo(tx.address, tx.value)
            }
        })
    }
}

const fft = new FFT()

//DONE
class BEP2{
    constructor (){
        const client = new BncClient(`https://${process.env.accelerated}`)
        client.chooseNetwork(process.env.bnb_network)
        this.address = client.recoverAccountFromMnemonic(process.env.mnemonic).address
        this.key = client.recoverAccountFromMnemonic(process.env.mnemonic).privateKey
        
        client.initChain()
        this.binance = client
    }

    hd = () => { return { address: this.address, key: this.key } }

    //DONE
    add = async (index,id) => {
        await db.user({index: index}, {$push: {'currency': {
            symbol: process.env.bnb_symbol,
            coin: 'Binance Coin (BEP2)',
            logo: '/assets/coin/bnb.png',
            address: this.address,
            balance: 0, 
            memo: id,
            to_swap: [{
                coin: 'FinFine',
                symbol: 'FFT'
            }]
        }}})
    }
    
    //DONE
    send = async (to, amount, id, memo) => {
        if ( (await redis.get(id)) == null ) {
            redis.set(id, 'locked')
            redis.expire(id, 15)
    
            if ( await insufficient(id, 'BNB', amount) ) {
                const fee = await fees(id, 'BNB')
                var sequence = (await axios(`https://${process.env.accelerated}/api/v1/account/${this.address}/sequence`)) || 0
                this.binance.setPrivateKey(this.key)
                var tx = {
                    hash: (await this.binance.transfer(this.address, to, amount - fee, process.env.bnb_symbol, memo, sequence)).result[0].hash,
                    address: to,
                    symbol: process.env.bnb_symbol,
                    value: amount - fee,
                    type: 'withdraw',
                    memo: memo
                }

                console.log(tx)

                const _amount = await minus(amount, 'withdraw', 'BNB')
                await changeBalanceWallet(id, 'BNB', _amount, 0, 'withdraw', tx)
                return tx   
            } else {
                return 'amount'
            }
        }
    }

    //DONE
    hook = () => {
        const conn = new WebSocket(`wss://${process.env.accelerated}/api/ws`)
        conn.on('open', () => {
            conn.send(JSON.stringify({ method: "subscribe", topic: "transfers", address: this.address }))
        })

        conn.on('message', async (e) => {
            const data = JSON.parse(e).data
            const tx = {
                hash: data.H,
                memo: data.M,
                address: data.t[0].o,
                symbol: data.t[0].c[0].a,
                value: data.t[0].c[0].A,
                type: 'deposit'
            }
            if ((tx.address == this.address) && (tx.symbol == process.env.bnb_symbol)) {
                console.log(tx)

                const fee = await fees( await addressToId(tx.address, 'BNB'), 'BNB') 
                const _amount = await minus(amount, 'deposit', 'BNB')
                await changeBalanceWallet(tx.address, 'BNB', _amount, fee, 'deposit', tx)
            }
        })
    }
}

const bnb = new BEP2()
btc.hook()
eth.hook()
usdt.hook()
fft.hook()
bnb.hook()

const create = async (id) => {
    var res = await btc.add(id)
    await eth.add(res.index)
    await usdt.add(res.index)
    await fft.add(res.index)
    await bnb.add(res.index, id)
}

const send = async (id, symbol, toAddress, amount, memo) => {
    switch (symbol){
        case 'BTC': return await btc.send(toAddress, amount, id, memo)
        case 'ETH': return await eth.send(toAddress, amount, id, memo)
        case 'USDT': return await usdt.send(toAddress, amount, id, memo)
        case 'FFT': return await fft.send(toAddress, amount, id, memo)
        case 'BNB': return await bnb.send(toAddress, amount, id, memo)
    }
}

const swapin = async (id, symbolFrom, amount) => {
    if ( await insufficient(id, symbolFrom, amount) ){
        const tx = {
            type: 'swapin',
            symbol: symbolFrom,
            hash: 'FFT' + randStr(29),
            address: id,
            value: amount,
            price: (await rate(symbolFrom, 'FFT'))
        }

        console.log(tx)
        const _amount = await minus(amount, 'swapin', symbolFrom)

        await changeBalanceWallet(id, symbolFrom, _amount, 0, 'swapin', tx)
        await tree.pay_swap_depo(id, amount * tx.price)
        return tx
    } else {
        return 'amount'
    }
}

const swapout = async (id, symbolTo, amount) => {
    const _amount = await minus(amount, 'swapout', symbolTo)
    if ( await insufficient(id, 'FFT', _amount) ){
        const tx = {
            type: 'swapout',
            symbol: symbolTo,
            hash: 'FFT' + randStr(29),
            address: id,
            value: _amount,
            price: (await rate(symbolTo, 'FFT'))
        }
        console.log(tx)
        await changeBalanceWallet(id, symbolTo, _amount, 0, 'swapout', tx)
        return tx
    } else {
        return 'amount'
    }
}

const switchs = async (id, to, symbol, amount) => {
    const toId = await findId(to)
    if ( await insufficient(id, symbol, amount) ){
        const txin = {
            type: 'switchin',
            symbol: symbol,
            hash: 'FFT' + randStr(29),
            address: id,
            value: amount,
        }

        const txout = {
            type: 'switchout',
            symbol: symbol,
            hash: 'FFT' + randStr(29),
            address: toId,
            value: amount,
        }

        const amountin = await minus(amount, 'switchin', symbol)
        const amountout = await minus(amount, 'switchout', symbol)

        await changeBalanceWallet(id, symbol, amountout, 0, 'switchout', txout)
        await changeBalanceWallet(toId, symbol, amountin, 0, 'switchin', txin)

        if (symbol == 'FFT'){
            await tree.pay_swap_depo(toId, amount)
        }
        
        console.log(txout)
        return txout
    } else {
        return 'amount'
    }
}

const deposit = async (id, symbol, amount) => {
    var tx = {
        hash: 'Test',
        value: amount,
        address: await idToAddress(id, symbol),
        symbol: symbol,
        type: 'deposit',
        memo: id
    }

    console.log(tx)

    const fee = await fees( id, symbol) 
    const _amount = await minus(amount, 'deposit', symbol)
    await changeBalanceWallet(id, symbol, _amount, fee, 'deposit', tx)

    if (symbol == 'FFT'){
        await tree.pay_swap_depo(id, tx.value)
    }
}

module.exports = {
    add_wallet: create,
    send: send,
    swapout: swapout,
    switchs: switchs,
    swapin: swapin,
    deposit: deposit,
}