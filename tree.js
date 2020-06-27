const DB = require('./db')
const db = new DB()
const R = require('ramda')

const { changeTokenFund, balanceOfId, addressToId, payInterest, changeValueFund, getPrice} = require('./func')

const mode = (level, dwFee, maxInvest, term, event, role) => {
    return {
        level: level,
        dwFee: dwFee,
        maxInvest: maxInvest,
        term: term,
        event: event,
        role: role,
    }
}

class PackageModel {
    constructor (brand, dynamic_interest, capital_required){

        // Tên gọi của gói
        this.brand = brand

        // Lãi suất động từ gói
        this.dynamic_interest = dynamic_interest /100

        // Lượng vốn yêu cầu
        this.capital_required = capital_required
    }
}

class LevelModel {
    constructor (static_receive, dynamic_receive){

        //Lãi tĩnh hệ thống
        this.static_receive = static_receive

        //Lãi động hệ thống
        this.dynamic_receive = dynamic_receive
    }
}

class Tree {
    package = (package_list) => {
        // Mảng danh sách gói
        this.package_list = package_list
    }

    level = (level_list, max_level) => {
        //Danh sách cấp
        this.level_list = level_list

        //Số tầng tối đa
        this.max_level = max_level
    }

    check_package = async (id) => {
        var balance = await balanceOfId(id, 'FFT')
        var priceFFT = await getPrice('FFT')
        var us_balance = balance * priceFFT
        return {
            package: R.filter( n => n.capital_required <= us_balance, this.package_list).pop(),
            balance: balance,
            us_balance: us_balance
        }
    }

    add_node = async (id, referral, info) => {
        var list_dad = (await db.user({id: referral}, 'list_dad'))[0].list_dad
        list_dad.pop()
        list_dad.unshift(referral)

        await db.user({id: id}, {$set: {info: info, list_dad: list_dad}})
    }

    view_child = async (id) => {
        var detail = []
        for (var i = 0; i <= this.max_level; i++) {
            detail.push({
                balance: 0,
                total: 0,
                member: []
            }) 
        }
        var doc = await db.user({'list_dad': id},'id info list_dad currency.balance currency.symbol')
        var child = R.map(user => {
            var balance = R.filter( n => n.symbol == 'FFT', user.currency).pop().balance 

            detail[0].balance += balance
            detail[0].total += 1

            const index = user.list_dad.indexOf(id) + 1
            detail[index].balance += balance
            detail[index].total += 1
            detail[index].member.push({
                id: user.id,
                info: user.info
            })

            return {
                balance: balance,
                id: user.id,
                dad: user.list_dad[0],
                info: user.info
            }}, doc)
            
            var main = (await db.user({id: id}, 'info'))[0].info
            var org = [{
                id: id,
                name: main.first_name + ' ' + main.last_name,
                post: (await this.check_package(id)).balance,
                phone: main.mobile,
                mail: main.email,
                photo: main.avatar,
                birthday: main.birthday,
                start: main.city,
                parent: null
            }]

            var orgArr = [[id , main.first_name + ' ' + main.last_name, (await this.check_package(id)).balance, main.mobile, main.email,  main.avatar, main.birthday, main.city, null]]

            child.forEach((us) => {
                org.push({
                    id: us.id,
                    name: us.info.first_name + ' ' + us.info.last_name,
                    post: us.balance,
                    phone: us.info.mobile,
                    mail: us.info.email,
                    photo: us.info.avatar,
                    birthday: us.info.birthday,
                    start: us.info.city,
                    parent: us.dad
                })

                orgArr.push(
                    [us.id, us.info.first_name + ' ' + us.info.last_name, us.balance, us.info.mobile, us.info.email, us.info.avatar, us.info.birthday, us.info.city, us.dad]
                )
            })
        return {
            detail: detail,
            diagram: child,
            org: org,
            orgArr: orgArr
        }
    }

    pay_swap_depo = async (who, value) => {
        console.log(who, value)
        var id = who
        if ( who.toString().length !==6 ){
            id = await addressToId(who, symbol)
        }

        var list_dad = (await db.user({id: id}, 'list_dad'))[0].list_dad
        const interest = this.level_list[0].static_receive

        for (var i=0; i < list_dad.length; i++ ){
            if (list_dad[i] !== null){
                var swap_dep_profit = interest[i] * value / 100
                await payInterest(list_dad[i], swap_dep_profit, 'direct_commission')
                console.log(list_dad[i], swap_dep_profit)
                await changeTokenFund(swap_dep_profit)
            }
        }
    }

    pay_order = async (profitUSD) => {
        const priceFFT = await getPrice('FFT')
        var profitFFT = profitUSD / priceFFT 

        const totalToken = (await db.system({}, 'totalToken'))[0].totalToken
        const rateProfitFFT = profitFFT / totalToken

        const interest = this.level_list[0].dynamic_receive
        var users = await db.user({}, 'id list_dad airdrop.static')
        
        for (var i = 0; i < users.length; i++ ){
            var nowUser = await this.check_package(users[i].id)

            const max = rateProfitFFT * nowUser.balance
            const received = max * nowUser.package.dynamic_interest
            await payInterest(users[i].id, received, 'dynamic_interest')

            profitFFT -= received
            const treeProfit = max - received

            var statics = (nowUser.balance * users[i].airdrop.static / (30 * 100)).toFixed(2)
            await payInterest(users[i].id, Number(statics), 'static_interest')
            profitFFT -= statics

            for (var j = 0; j < users[i].list_dad.length; j++){
                if ( users[i].list_dad[j] !== null){
                    var treeOrder = interest[j] * treeProfit / 100

                    await payInterest(users[i].list_dad[j], treeOrder, 'indirect_commission')
                    profitFFT -= treeOrder
                }
            }
        }

        const usedFFT = profitUSD / priceFFT - profitFFT
        await changeTokenFund(usedFFT)
        await changeValueFund(profitFFT * priceFFT * 0.3)

        await db.system({}, {
            $push: {
                pay: {
                    value: usedFFT * priceFFT
                }
            } 
        })

        await db.system({}, {
            $push: {
                profitDaily: {
                    value: profitUSD
                }
            } 
        })
        
        const newPriceFFT = await getPrice('FFT')
        await db.system({}, {
            $push: {
                price: [ Number(Date.now()), Number(newPriceFFT).toFixed(2)]
            }
        })

        return profitFFT * priceFFT * 0.7
    }

    limit = async (id) => {
        const us = (await this.check_package(id)).us_balance
        const token = (await this.check_package(id)).balance
        const user = (await db.user({id: id}, 'info.kyc info.finance_total airdrop.complete airdrop.members'))[0]
        const kyc = user.info.kyc, com_airdrop = user.airdrop.complete, members = user.airdrop.members, fin = user.info.finance_total
    
        const maxi = fin * 25 / 100
        var regime = mode(1, 5, 5000, 360, false, 'starter')
    
        if (token >= 100000000){
            regime = mode(8, 0, Infinity, 30, true, 'shareholder')
            return regime
        }
    
        if (kyc){
            regime = mode(2, 2, maxi, 180, false, 'kyc')
            if (com_airdrop){
                regime = mode(3, 1, maxi, 150, false, 'user')
                if (us >= 5000){
                    regime = mode(4, 0, maxi, 120, false, 'user')
                    if (members >= 20){
                        regime = mode(5, 0, maxi, 90, true, 'user')
                        if (members >= 50){
                            regime = mode(6, 0, maxi, 60, true, 'leader')
                            if (( us >= 50000 ) && ( members >= 1000 ) ){
                                regime = mode(7, 0, Infinity, 30, true, 'senior leader')
                            }
                        }
                    }
                }
            }
        }
        return regime
    }

    upTime = async (id, status) => {
        var arr = []
        const history = (await db.user({id: id}, 'history'))[0].history

        for ( var i = 0; i < history.length; i++){
            if ( (['deposit', 'switchin'].includes(history[i].type) && history[i].symbol == 'FFT') || (history[i].type == 'swapin') ){
                const now = (Date.now() / 1000).toFixed(0)
                const past = (history[i].timestamp / 1000).toFixed(0)
                const a_time = now - past
                const term = (await this.limit(id)).term * 86400
                if ((a_time > term) && (status == 'all' || status == 'one')){

                    await db.user({id: id, 'history.timestamp': history[i].timestamp}, {
                        $set: {
                            'history.$.expired': true
                        }
                    })

                    await db.user({id, id, 'currency.symbol': 'FFT'}, {
                        $inc: {
                            'currency.$.avai': history[i].value
                        }
                    })
                } else {
                    if (status == 'all' || status == 'two'){
                        arr.push({
                            type: history[i].type,
                            value: history[i].value,
                            date: history[i].date,
                            hash: history[i].hash,
                            dasys: (( term - a_time ) / 86400).toFixed(0)
                        })
                    }
                }
            }
        }
        return arr
    }
}

const pack_zero = new PackageModel('0 st', 0, 0)
const pack_one = new PackageModel('1 st', 35, 500)
const pack_two = new PackageModel('2 st', 40, 1000)
const pack_three = new PackageModel('3 st', 45, 5000)
const pack_four = new PackageModel('4 st', 50, 20000)
const pack_five = new PackageModel('5 st', 55, 50000)
const pack_six = new PackageModel('6 st', 60, 100000)

const package_list = [pack_zero, pack_one, pack_two, pack_three, pack_four, pack_five, pack_six]

const level_one = new LevelModel([5, 3, 2], [15, 10, 5])

const level_list = [level_one]

const tree = new Tree()
tree.package(package_list)
tree.level(level_list, 3)

module.exports = tree