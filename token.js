require('dotenv').config()

const { format } = require('number-currency-format')
const ObjectsToCsv = require('objects-to-csv')

const DB = require('./db')
const db = new DB()

const Redis = require("ioredis")
const redis = new Redis()

const {unixTo, sDay, sMonth, sAll, random} = require('./util')
const {balanceOfId, calTotalAction, typeSymbol, rate, getPrice} = require('./func')

class Price {
    assetsTotal = async (id, timeskip =0) => {
        var total = 0
        const priceFFT = await getPrice('FFT')
        const currencies = (await db.user({id: id}, 'currency'))[0].currency

        for (var i = 0; i < currencies.length; i++){
            total += currencies[i].balance * (await rate(currencies[i].symbol, 'FFT'))
        }

        const history = (await db.user({id: id}, 'history'))[0].history
        
        const outDays = await calTotalAction(history, ['withdraw', 'switchout'], typeSymbol, sDay, 'Self', timeskip)
        const inDays = await calTotalAction(history, ['deposit', 'switchin'], typeSymbol, sDay, 'Self', timeskip)
        const totalDays = inDays - outDays

        const outMonths = await calTotalAction(history, ['withdraw', 'switchout'], typeSymbol, sMonth, 'Self', timeskip)
        const inMonths = await calTotalAction(history, ['deposit', 'switchin'], typeSymbol, sMonth, 'Self', timeskip)
        const totalMonths = inMonths - outMonths

        return {
            USD: (total * priceFFT).toFixed(4),
            FFT: total.toFixed(4),
            totalDays: totalDays,
            totalMonths: totalMonths
        }
    }

    capitalTotal = async (id) => {
        const total = await balanceOfId(id, 'FFT', 'cal')
        const priceFFT = await getPrice('FFT')
        return {
            USD: ( total * priceFFT ).toFixed(4),
            FFT: total.toFixed(4)
        }
    }

    profitTotal = async (id) => {
        var total = 0
        const priceFFT = await getPrice('FFT')
        const details = (await db.user({id: id}, 'direct_commission static_interest dynamic_interest indirect_commission'))[0]
        
        const profits = (await db.user({id: id}, 'received'))[0].received
        for ( var i = 0; i < profits.length; i++){
            total += profits[i].value
        }

        return {
            USD: ( total * priceFFT ).toFixed(4),
            FFT: total.toFixed(4),
            direct_commission: details.direct_commission,
            static_interest: details.static_interest,
            dynamic_interest: details.dynamic_interest,
            indirect_commission: details.indirect_commission
        }
    }

    salesTotal = async (id) => {
        var total = 0
        const priceFFT = await getPrice('FFT')

        const childrens = await db.user({list_dad: id}, 'id history')
        for ( var i = 0; i < childrens.length; i++){
            total += await calTotalAction(childrens[i].history, ['deposit', 'switchin'], ['FFT'], sAll)
            total += await calTotalAction(childrens[i].history, ['swapin'], typeSymbol, sAll, 'FFT')
        }

        return {
            USD: (total * priceFFT).toFixed(4),
            FFT: total.toFixed(4)
        }
    }

    salesRefTotal = async (id) => {
        var total = 0
        const priceFFT = await getPrice('FFT')

        const childrens = await db.user({list_dad: id}, 'id history list_dad')

        for ( var i = 0; i < childrens.length; i++){
            if ( childrens[i].list_dad[0] == id ){
                total += await calTotalAction(childrens[i].history, ['deposit', 'switchin'], ['FFT'], sAll)
                total += await calTotalAction(childrens[i].history, ['swapin'], typeSymbol, sAll, 'FFT')
            }
        }
        
        return {
            USD: ( total * priceFFT ).toFixed(4),
            FFT: total.toFixed(4)
        }
    }

    //Them gia theo USD cho toan bo 
    totalByTime = async (id, timeskip = 0) => {
        const received = (await db.user({id: id}, 'history received'))[0].received
        const childrens = await db.user({list_dad: id}, 'id history list_dad')

        const totalDirComDay = await calTotalAction(received, ['direct_commission'], ['FFT'], sDay, '', timeskip)
        const totalDirComMonth = await calTotalAction(received, ['direct_commission'], ['FFT'], sMonth, '', timeskip)

        const totalStaIntDay = await calTotalAction(received, ['static_interest'], ['FFT'], sDay, '', timeskip)
        const totalStaIntMonth = await calTotalAction(received, ['static_interest'], ['FFT'], sMonth, '', timeskip)

        const totalDynIntDay = await calTotalAction(received, ['dynamic_interest'], ['FFT'], sDay, '', timeskip)
        const totalDynIntMonth = await calTotalAction(received, ['dynamic_interest'], ['FFT'], sMonth, '', timeskip)

        const totalIndComDay = await calTotalAction(received, ['indirect_commission'], ['FFT'], sDay, '', timeskip)
        const totalIndComMonth = await calTotalAction(received, ['indirect_commission'], ['FFT'], sMonth, '', timeskip)

        var totalSaleDay = 0, totalSaleMonth = 0, totalRefSaleDay = 0, totalRefSaleMonth = 0

        for (var i = 0; i < childrens.length; i++){
            if (childrens[i].list_dad[0] == id ){
                totalRefSaleDay += await calTotalAction(childrens[i].history, ['deposit', 'switchin'], ['FFT'], sDay, '', timeskip)
                totalRefSaleDay += await calTotalAction(childrens[i].history, ['swapin'], typeSymbol, sDay, 'FFT', timeskip)

                totalRefSaleMonth += await calTotalAction(childrens[i].history, ['deposit', 'switchin'], ['FFT'], sMonth, '', timeskip)
                totalRefSaleMonth += await calTotalAction(childrens[i].history, ['swapin'], typeSymbol, sMonth, 'FFT', timeskip)
            }

            totalSaleDay += await calTotalAction(childrens[i].history, ['deposit', 'switchin'], ['FFT'], sDay, '', timeskip)
            totalSaleDay += await calTotalAction(childrens[i].history, ['swapin'], typeSymbol, sDay, 'FFT', timeskip)

            totalSaleMonth += await calTotalAction(childrens[i].history, ['deposit', 'switchin'], ['FFT'], sMonth, '', timeskip)
            totalSaleMonth += await calTotalAction(childrens[i].history, ['swapin'], typeSymbol, sMonth, 'FFT', timeskip)
        }

        return {
            days: {
                profits: {
                    direct_commission: totalDirComDay,
                    static_interest: totalStaIntDay,
                    dynamic_interest: totalDynIntDay,
                    indirect_commission: totalIndComDay 
                },
                sales: totalSaleDay,
                ref: totalRefSaleDay
            },
            months: {
                profits: {
                    direct_commission: totalDirComMonth,
                    static_interest: totalStaIntMonth,
                    dynamic_interest: totalDynIntMonth,
                    indirect_commission: totalIndComMonth 
                },
                sales: totalSaleMonth,
                ref: totalRefSaleMonth
            }
        }
    }

    trading = async (timeskip = 0) => {
        const fund = (await db.system({}, 'totalFund totalToken tokenBlock totalOrder totalProfit profitDaily pay'))[0]
        var totalDay = fund.profitDaily[fund.profitDaily.length -1].value
        var totalPayDay = fund.pay[fund.pay.length -1].value

        if (timeskip == 1){
            totalDay = fund.profitDaily[fund.profitDaily.length -2].value
            totalPayDay = fund.pay[fund.pay.length -2].value
        }

        var totalMonth = 0
        fund.profitDaily.forEach((daily) => {
            if (sMonth(daily.timestamp, timeskip)){
                totalMonth += daily.value
            }
        })

        var totalPayMonth = 0
        fund.pay.forEach(async (paid, st) =>{

            if (sMonth(paid.timestamp, timeskip)){
                totalPayMonth += paid.value
            }
        })
        return {
            capital: fund.totalFund,
            activeToken: fund.totalToken,
            blockedToken: fund.tokenBlock,
            order: fund.totalOrder,
            profit: fund.totalProfit,
            days: totalDay,
            months: totalMonth,
            pay_days: totalPayDay,
            pay_months: totalPayMonth
        }
    }

    writeLog = async () => {
        const orders = (await db.system({}, 'orders'))[0].orders
        if (orders.length == 20000){
            const keep = orders.slice(10000, 20000)
            await db.system({}, {
                $set: {
                    orders: keep
                }
            })
            const logs = orders.slice(0, 10000)
            const name = (Date.now()).toString()
            const csv = new ObjectsToCsv(logs)
            await csv.toDisk(`./storage/${name}.csv`, { bom: true })
            console.log('Write Log HFT at: ', unixTo().format)
        }
    }

    liveOrder = async () => {
        const orders = (await db.system({}, 'orders'))[0].orders
        if (orders.length <= 100){
            //
        } else {
            const reorders = orders.slice(orders.length - 100, orders.length)
            var series = []
            for ( var i = 0; i <100; i++){
                series.push([Number(reorders[i].timestamp), reorders[i].profit])
            }

            return {
                orders: reorders.reverse(),
                series: series,
                profit: format(Number(await redis.get('profitDay')).toFixed(2)),
                total_profit: format(Number((await db.system({},'totalProfit'))[0].totalProfit).toFixed(2)),
                number: (await db.system({},'totalOrder'))[0].totalOrder,
            }
        }
    }

    getToken = async () => {
        const s = await db.system({}, '')
    }

    basicAdmin = async (timeskip =0) => {
        const totalFlow = (await db.admin({}, 'totalFlow'))[0].totalFlow

        const btcDep = await calTotalAction(totalFlow, ['deposit'], ['BTC'], sAll, '', timeskip)
        const btcWit = await calTotalAction(totalFlow, ['withdraw'], ['BTC'], sAll, '', timeskip)

        const btcDepDay = await calTotalAction(totalFlow, ['deposit'], ['BTC'], sDay, '', timeskip)
        const btcWitDay = await calTotalAction(totalFlow, ['withdraw'], ['BTC'], sDay, '', timeskip)

        const btcDepMonth = await calTotalAction(totalFlow, ['deposit'], ['BTC'], sMonth, '', timeskip)
        const btcWitMonth = await calTotalAction(totalFlow, ['withdraw'], ['BTC'], sMonth, '', timeskip)

        const ethDep = await calTotalAction(totalFlow, ['deposit'], ['ETH'], sAll, '', timeskip)
        const ethWit = await calTotalAction(totalFlow, ['withdraw'], ['ETH'], sAll, '', timeskip)

        const ethDepDay = await calTotalAction(totalFlow, ['deposit'], ['ETH'], sDay, '', timeskip)
        const ethWitDay = await calTotalAction(totalFlow, ['withdraw'], ['ETH'], sDay, '', timeskip)

        const ethDepMonth = await calTotalAction(totalFlow, ['deposit'], ['ETH'], sMonth, '', timeskip)
        const ethWitMonth = await calTotalAction(totalFlow, ['withdraw'], ['ETH'], sMonth, '', timeskip)

        const usdtDep = await calTotalAction(totalFlow, ['deposit'], ['USDT'], sAll, '', timeskip)
        const usdtWit = await calTotalAction(totalFlow, ['withdraw'], ['USDT'], sAll, '', timeskip)

        const usdtDepDay = await calTotalAction(totalFlow, ['deposit'], ['USDT'], sDay, '', timeskip)
        const usdtWitDay = await calTotalAction(totalFlow, ['withdraw'], ['USDT'], sDay, '', timeskip)

        const usdtDepMonth = await calTotalAction(totalFlow, ['deposit'], ['USDT'], sMonth, '', timeskip)
        const usdtWitMonth = await calTotalAction(totalFlow, ['withdraw'], ['USDT'], sMonth, '', timeskip)

        const bnbDep = await calTotalAction(totalFlow, ['deposit'], ['BNB'], sAll, '', timeskip)
        const bnbWit = await calTotalAction(totalFlow, ['withdraw'], ['BNB'], sAll, '', timeskip)

        const bnbDepDay = await calTotalAction(totalFlow, ['deposit'], ['BNB'], sDay, '', timeskip)
        const bnbWitDay = await calTotalAction(totalFlow, ['withdraw'], ['BNB'], sDay, '', timeskip)

        const bnbDepMonth = await calTotalAction(totalFlow, ['deposit'], ['BNB'], sMonth, '', timeskip)
        const bnbWitMonth = await calTotalAction(totalFlow, ['withdraw'], ['BNB'], sMonth, '', timeskip)

        const finn = {
            btc: {
                deposit: {
                    months: btcDepMonth,
                    days: btcDepDay,
                    full: btcDep
                },
                withdraw: {
                    months: btcWitMonth,
                    days: btcWitDay,
                    full: btcWit
                }
            },
            eth: {
                deposit: {
                    months: ethDepMonth,
                    days: ethDepDay,
                    full: ethDep
                },
                withdraw: {
                    months: ethWitMonth,
                    days: ethWitDay,
                    full: ethWit
                }
            },
            usdt: {
                deposit: {
                    months: usdtDepMonth,
                    days: usdtDepDay,
                    full: usdtDep
                },
                withdraw: {
                    months: usdtWitMonth,
                    days: usdtWitDay,
                    full: usdtWit
                }
            },
            bnb: {
                deposit: {
                    months: bnbDepMonth,
                    days: bnbDepDay,
                    full: bnbDep
                },
                withdraw: {
                    months: bnbWitMonth,
                    days: bnbWitDay,
                    full: bnbWit
                }
            }
        }
        console.log(finn)
        return finn
    }

    column = async () => {
        var res = (await db.system({}, 'price'))[0].price
        var abc = res.slice(res.length - 20, res.length)
        var series = [], label = []
        abc.forEach((day) => {
            series.push(Number(day[1]))
            label.push(unixTo(day[0]).dm)
        })
        return {
            series: series,
            label: label
        }
    }

    pie = async () => {
        const fund = (await db.system({}, 'totalToken tokenBlock'))[0]
        return [ Number(fund.tokenBlock) , Number(fund.totalToken) , Number(process.env.max_token - fund.tokenBlock - fund.totalToken) ]
    }

    calculate = async (amount, symbol, period) => {
        const fund = (await db.system({}, 'totalToken price totalFund pay'))[0]
        const symbol_expected = (await getPrice(symbol)) * random(30, 90) / 100
        const amount_ftt = amount * (await rate(symbol, 'FFT'))
        const percent_fund = amount_ftt / (fund.totalToken + amount_ftt)
        const statics = amount_ftt * (period * 0.03)
        const dynamic = amount_ftt * (( fund.pay[fund.pay.length - 1].value + fund.pay[fund.pay.length - 1].value) / ( fund.totalFund * 2 )) * period * 30
        const fft_expected = (await getPrice('FFT')) * ( ( fund.price[fund.price.length - 1] / fund.price[fund.price.length - 2] ) ** (period * 30) )

        const profit = ( dynamic + statics ) * fft_expected
        const last_percent = profit / ( amount * symbol_expected )

        return {
            numberFTT: amount_ftt.toFixed(2),
            percentFund: percent_fund.toFixed(2),
            expectedFFT: fft_expected.toFixed(2),
            expectedSYM: symbol_expected.toFixed(2),
            expectedProfit: profit.toFixed(2),
            percentProfit: last_percent.toFixed(2),
            sym: symbol
        }
    }
}

const price = new Price()


module.exports = price