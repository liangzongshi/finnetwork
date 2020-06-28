const DB = require('./db')
const db = new DB()
const typeIn = ['deposit', 'swapout', 'switchin'], typeOut= ['withdraw', 'swapin', 'switchout']
const typeSymbol = ['BTC', 'ETH', 'USDT', 'BNB', 'FFT']
const typePay = ['direct_commission', 'static_interest', 'dynamic_interest', 'indirect_commission']

const Binance = require('binance-api-node').default
const bnb = new Binance()
//Lay Gia
const getPrice = async (symbol) => {
    if (process.env.MODE == 'dev'){
        if (symbol == 'FFT'){
            var doc = (await db.system({}, 'totalFund totalToken'))[0] 
            var price = doc.totalFund / doc.totalToken
            return price.toFixed(4)
        }
        
        return 1
    } else {
        if (symbol == 'FFT'){
            var doc = (await db.system({}, 'totalFund totalToken'))[0] 
            var price = doc.totalFund / doc.totalToken
            return price.toFixed(4)
        }
    
        if (symbol == 'USDT'){
            return 1
        }
    
        const pairs = await bnb.prices()
        var price = pairs[`${symbol}USDT`]
        return Number(price).toFixed(4)
    }
}

//Lay Ty Le
const rate = async (X, Y) => {
    const priceX = await getPrice(X)
    const priceY = await getPrice(Y)
    return Number(priceX / priceY).toFixed(2)
}

const changeTokenFund = async (amount) => {
    const tokenBlock = (await db.system({}, 'tokenBlock'))[0].tokenBlock
    const _price = await getPrice('FFT')
    var newTokenBlock

    if (tokenBlock >= amount){
        newTokenBlock = -amount
    } else {
        newTokenBlock = 0
    }

    await db.system({}, {
        $inc: {
            totalFund: amount * _price,
            totalToken: amount,
            tokenBlock: newTokenBlock,
        }
    })
}

const changeValueFund = async (amount) => {
    await db.system({}, {
        $inc: {
            totalFund: amount
        }
    })
}

//act => thuc hien hanh dong || cal => dung de tinh toan
const balanceOfId = async (id, symbol, purpose = 'cal') => {
    console.log('OK OK')
    const currencies = (await db.user({id: id}, 'currency'))[0].currency
    const thisCurrency = (currencies.filter( currency => currency.symbol == symbol))[0]
    if (symbol == 'FFT' && purpose == 'act'){
        return thisCurrency.avai
    } else {
        return thisCurrency.balance
    }
}

const insufficient = async (id, symbol, amount) => {
    var purpose = 'cal'
    if (symbol == 'FFT'){ purpose = 'act'}
    return (await balanceOfId(id, symbol, purpose)) >= amount
}

const addressToId = async (address, symbol) => {
    var _address = address
    if (symbol == 'ETH'){
        _address = {$regex: new RegExp('^' + address, 'i')}
    }
    return (await db.user({'currency.address': _address}, 'id'))[0].id
}

const idToAddress = async (id, symbol) => {
    const currency = (await db.user({id: id}, 'currency'))[0].currency
    const t = currency.filter( n => n.symbol == symbol)
    return t[0].address
}

const minus = async (amount, action, symbol) => {
    var gt = amount
    if (action == 'swapout'){
        gt = amount * (await rate('FFT', symbol))
    }
    if (typeOut.includes(action)){
        return -gt
    }
    return gt
}

const changeBalanceWallet = async (who ,symbol, amount, fee, action, tx) => {
    
    var id = who
    if ( who.toString().length > 8 ){
        id = await addressToId(who, symbol)
    }

    await db.user({id: id, 'currency.symbol': symbol}, {
        $inc: {
            'currency.$.balance': amount - fee,
        }
    })

    const cover = -amount * (await rate(symbol, 'FFT'))

    if (action == 'swapin' || action == 'swapout'){
        await db.user({id: id, 'currency.symbol': 'FFT'}, {
            $inc: {
                'currency.$.balance': cover - fee,
            }
        })

        changeTokenFund(cover - fee)
    }

    if (action == 'swapout'){
        await db.user({id: id, 'currency.symbol': 'FFT'}, {
            $inc: {
                'currency.$.avai': cover - fee,
            }
        })
    }

    if (symbol == 'FFT' && amount < 0){
        await db.user({id: id, 'currency.symbol': 'FFT'}, {
            $inc: {
                'currency.$.avai': amount - fee,
            }
        })
    }

    if (symbol !== 'FFT' && (action == 'deposit' || action =='withdraw')){
        await db.admin({}, {
            $push: {
                totalFlow: {
                    type: action,
                    symbol: symbol,
                    value: amount
                }
            }
        })
    }

    if (symbol == 'FFT' && (action == 'deposit' || action == 'withdraw')){
        changeTokenFund(amount - fee)
    }

    await db.user({id: id}, {
        $push: {
            history: tx
        }
    })
}

const payInterest = async (who, amount, action) => {
    var id = who
    if ( who.toString().length > 8 ){
        id = await addressToId(who, symbol)
    }

    var update = {
        'currency.$.balance': amount, 
        'currency.$.avai': amount
    }

    update[action] = amount

    await db.user({id: id, 'currency.symbol': 'FFT'}, {
        $inc: update, 
        $push: {
            'received': {
                type: action,
                value: amount,
            }
        }
    })
}

const calTotalAction = async (array, action, symbol, timer, cover, skip = 0) => {
    var total = 0
    for (var i = 0; i < array.length; i++){
        console.log()
        if ( action.includes(array[i].type) && symbol.includes(array[i].symbol) && timer(array[i].timestamp, skip) ){
            if (cover == 'FFT'){
                total += array[i].value * array[i].price
            } else {
                if (cover == 'Self'){
                    total += array[i].value * (await getPrice(array[i].symbol))
                } else {
                    total += array[i].value
                }
            }
        }
    }
    return total
}

const findId = async (param) => {
    const checkId = (await db.user({id: param},'id'))[0]
    if (checkId !== undefined){
        return checkId.id
    }
    const checkMobile = (await db.user({'info.mobile': param},'id'))[0]
    if (checkMobile !== undefined){
        return checkMobile.id
    }
    const checkEmail = (await db.user({'info.email': param},'id'))[0]
    if (checkEmail !== undefined){
        return checkEmail.id
    }
}

module.exports = {
    getPrice: getPrice,
    rate: rate,
    changeTokenFund: changeTokenFund,
    balanceOfId: balanceOfId,
    insufficient: insufficient,
    addressToId: addressToId,
    minus: minus,
    changeBalanceWallet: changeBalanceWallet,
    payInterest: payInterest,
    changeValueFund: changeValueFund,
    calTotalAction: calTotalAction,
    findId: findId,
    idToAddress: idToAddress,
    typeOut: typeOut,
    typeIn: typeIn,
    typeSymbol: typeSymbol,
    typePay: typePay
}