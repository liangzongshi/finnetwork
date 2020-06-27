
// const city = async () => {
//     const td = await axios('https://maps.googleapis.com/maps/api/geocode/json?address=Ha+Noi,+84&key=AIzaSyBF3HwM7fDAflnFGiTTSv3c_7YTBh6py2s')
//     console.log(td)
// }
// city()

require('dotenv').config()
const axios = require('axios')

const DB = require('./db')
const db = new DB()

const Redis = require("ioredis")
const redis = new Redis()

const tree = require('./tree')
const price = require('./token')
const airdrop = require('./airdrop')

const { getClient } = require('bottender')
const tlgClient = getClient('telegram')

const {unixTo, randStr, sDay, sMonth} = require('./util')

class Group {
    createChat = async (tlgId) => {
        const groups = (await db.system({}, 'groups'))[0].groups
        const chatId = 'finfineio' + groups.length

        tlgClient.sendMessage(process.env.TELEGRAM_ADMIN, 'Create Group: ', {
        })

        tlgClient.sendMessage(process.env.TELEGRAM_ADMIN, tlgId, {
        })

        tlgClient.sendMessage(process.env.TELEGRAM_ADMIN, chatId, {
        })

        return chatId
    }

    addChat = async (tlgId, chatId) => {

    }

    new = async (id) => {
        const limit = await tree.limit(id)
        if (limit.role == 'leader'){
            const user = (await db.user({id: id}, 'info.joined info.city'))[0]
            //Xoa khoi nhom da tham gia
            if (user.info.joined !== null){
                await db.system({'groups.code': user.info.joined}, {
                    $pull: {
                        'groups.$.members': id
                    }
                })
            }

            const code = randStr(8)
            const tlgId = (await db.user({id: id}, 'message.telegram.id'))[0].message.telegram.id
            const chat = await this.createChat(tlgId)
            await db.system({}, {
                $push: {
                    groups: {
                        code: code,
                        local: user.info.city,
                        members: [id],
                        chat: chat
                    }
                },
                $set: {
                    'info.joined': code
                }
            })
        }
    }

    join = async (id, codeGroup) => {
        const user = (await db.user({id: id}, 'info'))[0]
        const teams = (await db.system({'groups.code': codeGroup}, 'groups'))[0].groups
        const team = (teams.filter( element => element.code == codeGroup))[0]
        const limit = await tree.limit(id)

        if ((limit.role == 'user') && (user.info.joined == null) && (user.info.city == team.local) && (team.members.length < 100)){
            await db.user({id: id}, {
                $set: {
                    'info.joined': codeGroup
                }
            })

            await db.system({'groups.code': codeGroup}, {
                $push: {
                    'groups.$.members': id
                }
            })

            const tlgId = (await db.user({id: id}, 'message.telegram.id'))[0].message.telegram.id

            await this.addChat(tlgId, '@' + team.chat)
            return true
        }
        return false
    }

    topGroup = async () => {
        var mix = []
        const groups = (await db.system({}, 'groups'))[0].groups
        for (var i = 0; i < groups.length; i++) {
            var mem = []
            for (var j = 0; j < groups[i].members.length; j++){
                const add = (await price.salesRefTotal(groups[i].members[j])).FFT
                mem.push({
                    id: groups[i].members[j],
                    sales: add
                })
            }

            var salesGroup = 0
            mem.forEach(async (t) => { salesGroup += t.sales })
            
            mix.push({
                listMember: mem,
                code: groups[i].code,
                name: groups[i].name,
                local: groups[i].local,
                avt: groups[i].avt,
                sales: salesGroup,
                number: groups[i].members.length
            })
        }
        
        mix.sort((a,b) => b.sales - a.sales)
        return mix
    }

    listMember = async (id) => {
        const codeGroup = (await db.user({id: id}, 'info.joined'))[0].info.joined
        if (codeGroup !== null){
            const teams = (await db.system({'groups.code': codeGroup}, 'groups'))[0].groups
            const team = (teams.filter( element => element.code == codeGroup))[0].members
            const members = team.members
            var mem = []

            for (let i = 0; i < members.length; i++){
                const add = (await price.salesRefTotal( members[i] )).FFT
                const inf = (await db.user({id: members[i] },'info.first_name info.last_name info.email info.mobile info.job'))[0].info

                mem.push({
                    id: members[i],
                    info: inf,
                    sales: add
                })
            }

            var salesGroup = 0
            mem.forEach(async (t) => {
                salesGroup += t.sales
            })

            return {
                mem: mem,
                salesGroup: salesGroup,
                team: team
            }
        } else {
            return null
        }
    }

    listGroup = async (id) => {
        const codeGroup = (await db.user({id: id}, 'info.joined'))[0].info.joined
        if (codeGroup == null){
            const city = (await db.user({id: id}, 'info.city'))[0].info.city
            const teams = (await db.system({'groups.local': city}, 'groups'))[0].groups
            const team = teams.filter( element => element.local == city)
            var dom = []

            for (var i = 0; i < team.length; i++) {
                const leaderID = team[i].members[0]
                const leader = (await db.user({id: leaderID}, 'info.first_name info.last_name info.email info.mobile info.job'))[0].info
                dom.push({
                    leader: leader,
                    number: team[i].members.length,
                    code: team[i].code,
                    name: team[i].name,
                    offline: team[i].offline,
                    time: team[i].time,
                    avt: team[i].avt,
                })
            }

            return dom
        } else {
            return null
        }
    }

    editName = async (id, codeGroup, newName) => {
        const teams = (await db.system({'groups.code': codeGroup}, 'groups'))[0].groups
        const team = (teams.filter( element => element.code == codeGroup))[0]
        if (team.members[0] == id){
            await db.system({'groups.code': codeGroup}, {
                $set: {
                    'groups.$.name': newName
                }
            })
        }
    }

    editOffline = async (id, codeGroup, newOffline) => {
        const teams = (await db.system({'groups.code': codeGroup}, 'groups'))[0].groups
        const team = (teams.filter( element => element.code == codeGroup))[0]
        if (team.members[0] == id){
            await db.system({'groups.code': codeGroup}, {
                $set: {
                    'groups.$.offline': newOffline
                }
            })
        }
    }

    editTime = async (id, codeGroup, newTime) => {
        const teams = (await db.system({'groups.code': codeGroup}, 'groups'))[0].groups
        const team = (teams.filter( element => element.code == codeGroup))[0]
        if (team.members[0] == id){
            await db.system({'groups.code': codeGroup}, {
                $set: {
                    'groups.$.time': newTime
                }
            })
        }
    }

    deleteMember = async (leaderId, codeGroup, userId) => {
        const teams = (await db.system({'groups.code': codeGroup}, 'groups'))[0].groups
        const team = (teams.filter( element => element.code == codeGroup))[0]
        if (team.members[0] == leaderId){
            await db.system({'groups.code': codeGroup}, {
                $pull: {
                    'groups.$.members': userId
                }
            })
            
            await db.user({id: userId}, {
                $set: {
                    'info.joined': null
                }
            })
            return true
        }
        return false
    }

    viewAll = async () => {
        const groups = (await db.system({}, 'groups'))[0].groups
        var result = []

        for (let i = 0; i < groups.length; i++){
            const leader = (await db.user({id: groups[i].members[0]}, 'info.first_name info.last_name info.email info.mobile info.job'))[0].info
            result.push({
                code: groups[i].code,
                name: groups[i].name,
                local: groups[i].local,
                avt: groups[i].avt,
                chat: groups[i].chat,
                meeting: groups[i].meeting,
                offline: groups[i].offline,
                time: groups[i].time,
                number: groups[i].members.length,
                leader: leader,
                leaderId: groups[i].members[0]
            })
        }

        return result
    }

    topInvester = async () => {
        const users = await db.user({}, 'id currency.balance currency.symbol')

        var newUsers = []
        for (var i = 0; i < users.length; i++){
            for (var j = 0; j < users[i].currency.length; j++){
                if (users[i].currency[j].symbol == 'DGG'){
                    newUsers.push({
                        id: users[i].id,
                        invest: users[i].currency[j].balance
                    })
                }
            }
        }

        newUsers.sort((a,b) => b.invest - a.invest)
        return newUsers
    }

    topSaler = async () => {
        const users = await db.user({}, 'id')
        var newUsers = []
        for (var i = 0; i < users.length; i++) {
            newUsers.push(users[i].id)
        }

        var mem = []
        for (var i = 0; i < newUsers.length; i++) {
            const add = (await price.salesRefTotal(newUsers[i]))
            const inf = (await db.user({id: newUsers[i]},'info.first_name info.last_name info.email info.mobile info.job'))[0].info
            mem.push({
                id: newUsers[i],
                info: inf,
                sales: add
            })
        }

        mem.sort((a,b) => b.sales - a.sales)
        return mem
    }

    //Cho chay vao cuoi Thang
    bonusEvent = async () => {
        const events = (await db.admin({}, 'events'))[0].events
        const now = events[events.length -1]
        var i_top = now.invester.top, i_unit = now.invester.unit, i_value = now.invester.value
        var s_top = now.saler.top , s_unit = now.saler.unit, s_value = now.saler.value
        var  g_top = now.group.top, g_unit = now.group.unit, g_value = now.group.value, g_leader = now.group.leader

        if (i_unit == 'NNI' || s_unit == 'NNI' || g_unit == 'NNI'){
            const t = await price.trading()
            const nni = t.months - t.pay_months
            const fft = await getPrice('FFT')
            if (i_unit == 'NNI'){
                i_value = (i_value * nni / fft ) / 100
                i_unit = 'FFT'
            }
            if (s_unit == 'NNI'){
                s_value = (s_value * nni / fft ) / 100
                s_unit = 'FFT'
            }
            if (g_unit == 'NNI'){
                g_value = (g_value * nni / fft ) / 100
                g_unit = 'FFT'
            }
        }

        const topInv = await this.topInvester()

        const topI = topInv.slice(0, i_top)
        var totalTopInvester = 0
        topI.forEach(async (t) => {
            totalTopInvester += t.invest
        })

        topI.forEach(async (t) => {
            const receive = (i_value * t.invest / totalTopInvester ).toFixed(4)

            await db.admin({'events.timestamp': events.timestamp}, {
                $push: {
                    'events.$.invester.received': {
                        'who': t.id,
                        'value': receive,
                        'symbol': i_symbol
                    }
                }
            })

            await db.user({id: t.id, 'currency.symbol': i_unit}, {
                $inc: {
                    'currency.$.balance': receive,
                    'currency.$.avai': receive
                }
            })

            await db.user({id: t.id}, {
                $push: {
                    'bonus': {
                        value: receive,
                        symbol: i_symbol,
                        type: 'TopInvester'
                    }
                }
            })
        })


        const topSal = await this.topSaler()

        const topS = topSal.slice(0, s_top)
        var totalTopSaler = 0
        topS.forEach(async (t) => {
            totalTopSaler += t.sales
        })

        topS.forEach(async (t) => {
            const receive = (s_value * t.sales / totalTopSaler ).toFixed(4)

            await db.admin({'events.timestamp': events.timestamp}, {
                $push: {
                    'events.$.saler.received': {
                        'who': t.id,
                        'value': receive,
                        'symbol': s_symbol
                    }
                }
            })

            await db.user({id: t.id, 'currency.symbol': s_unit}, {
                $inc: {
                    'currency.$.balance': receive,
                    'currency.$.avai': receive
                }
            })

            await db.user({id: t.id}, {
                $push: {
                    'bonus': {
                        value: receive,
                        symbol: s_symbol,
                        type: 'TopSaler'
                    }
                }
            })
        })

        const topGro = await this.topGroup()

        const topG = topGro.slice(0, g_top)
        var totalTopGroup = 0
        topG.forEach(async (t) => {
            totalTopGroup += t.sales
        })

        topG.forEach(async (t) => {
            const receive = (g_value * t.sales / totalTopGroup ).toFixed(4)
            var totalUserInGroup = 0
            t.listMember.forEach( async (user) =>{
                totalUserInGroup += user.sales
            })

            t.listMember.forEach( async (user, ss) =>{
                const forLeader = (receive * g_leader / 100).toFixed(4)
                const forMember = (receive - forLeader).toFixed(4)

                const receiveUser = (forMember * user.sales / totalUserInGroup).toFixed(4)

                if (ss == 0){
                    await db.admin({'events.timestamp': events.timestamp}, {
                        $push: {
                            'events.$.group.received': {
                                'who': user.id,
                                'value': forLeader,
                                'symbol': g_symbol
                            }
                        }
                    })
    
                    await db.user({id: user.id, 'currency.symbol': g_unit}, {
                        $inc: {
                            'currency.$.balance': forLeader,
                            'currency.$.avai': forLeader
                        }
                    })
    
                    await db.user({id: user.id}, {
                        $push: {
                            'bonus': {
                                value: forLeader,
                                symbol: g_symbol,
                                type: 'TopLeader'
                            }
                        }
                    })
                }

                await db.admin({'events.timestamp': events.timestamp}, {
                    $push: {
                        'events.$.group.received': {
                            'who': user.id,
                            'value': receiveUser,
                            'symbol': g_symbol
                        }
                    }
                })

                await db.user({id: user.id, 'currency.symbol': g_unit}, {
                    $inc: {
                        'currency.$.balance': receiveUser,
                        'currency.$.avai': receiveUser
                    }
                })

                await db.user({id: user.id}, {
                    $push: {
                        'bonus': {
                            value: receiveUser,
                            symbol: g_symbol,
                            type: 'TopGroup'
                        }
                    }
                })
            })
        })

        const full = i_value * (await getPrice(i_symbol)) + s_value * (await getPrice(s_symbol)) + g_value * (await getPrice(g_symbol))
        await db.admin({'events.timestamp': events.timestamp}, {
            $set: {
                'events.$.totalBonus': full
            }
        })
    }

    setEvent = async (i_top, i_unit, i_value, s_top, s_unit, s_value, g_top, g_unit, g_value, g_leader) => {
        await db.admin({}, {
            $push: {
                events: {
                    invester: {
                        top: i_top,
                        unit: i_unit,
                        value: i_value
                    },
                    saler: {
                        top: s_top,
                        unit: s_unit,
                        value: s_value
                    },
                    group: {
                        top: g_top,
                        unit: g_unit,
                        value: g_value,
                        leader: g_leader
                    }
                }
            }
        })
    }

    getListBonus = async (id) => {
        const bonus = (await db.user({id: id}, 'bonus'))[0].bonus
        var total = 0 
        bonus.forEach((b) => {
            total += b.value
        })

        return {
            bonus: bonus, 
            total: total
        }
    }

    getBonus = async () => {
        const events = (await db.admin({}, 'events'))[0].events
        return events
    }

    getLeader = async () => {
        const groups = (await db.system({}, 'groups.members'))[0].groups
        var leader = []
        groups.forEach( async (gr) =>{
            leader.push(gr.members[0])
        })
        var detail = []
        for (var i = 0; i < leader.length; i++){
            const user = (await db.user({id: leader[i]}, 'id info.email info.mobile'))[0]
            detail.push(user)
        }
        return {
            leader: leader,
            detail: detail
        }
    }
}

const group = new Group()
module.exports = group

!(async () => {
})()