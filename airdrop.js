require('dotenv').config()
const DB = require('./db')
const db = new DB()

const Redis = require("ioredis")
const redis = new Redis()

const tree = require('./tree')
const group = require('./group')
const {randStr} = require('./util')

const { getClient } = require('bottender')
const tlgClient = getClient('telegram')
const msgClient = getClient('messenger')

class Airdrop {
    newCode = async (id) => {
        var code = 'ff'+randStr(6)
        const check = await redis.get(code)
        if (check !== null){ this.newCode(id) }
        await redis.set(code, id)
        redis.expire(code, 300)
        return code
    }

    getF1 = async (id) => {
        const childs = await db.user({list_dad: id}, 'id list_dad')
        var f1 = []
        childs.forEach( async (child, st) => {
            if (child.list_dad[0] == id){
                f1.push(child.id)
            }
        })
        return f1
    }

    deleteUser = async (id)=>{
        const f1 = await this.getF1(id)
        const list_dad = (await db.user({id:id}, "list_dad"))[0].list_dad
        await db.User.deleteOne({id:id})
        for(var i = 0; i < f1.length; i++){
            await db.user({id: f1[i]}, {$set: {list_dad: list_dad}})
        }
    }

    setSocial = async (id) => {
        const air = (await db.user({id: id}, 'airdrop'))[0].airdrop
        if (air.messenger && air.telegram && air.youtube){
            await db.user({id: id}, {
                $set: {
                    'airdrop.complete': true,
                    'airdrop.static': 1
                }
            })
        }
    }

    checkAirInvest = async () => {
        const dads = await db.user({}, 'id')
        dads.forEach(async (dad, st) => {
            const members = (await db.user({id: dad.id}, 'airdrop.members'))[0].airdrop.members
            const childs = await this.getF1(dad.id)
            var investerChild = 0
            childs.forEach(async (child, ts) => {
                const invested = (await tree.check_package(child)).us_balance
                if (invested >= 500){
                    investerChild += 1
                }
                if (ts == childs.length -1){
                    if (investerChild > members){

                        await group.new(dad.id)

                        const stati = (await db.user({id: dad.id}, 'airdrop.static'))[0].airdrop.static
                        if (stati >=1){
                            var stt
                            if (investerChild >=1){
                                stt = 2
                                if (investerChild >=5){
                                    stt = 4
                                    if (investerChild >= 10){
                                        stt = 5
                                        if (investerChild >= 20){
                                            stt = 6
                                        }
                                    }
                                }
                            }

                            await db.user({id: dad.id}, {
                                $set: {
                                    'airdrop.members': investerChild,
                                    'airdrop.static': stt
                                }
                            })
                        }
                    }
                }
            })
        })
    }

    getAll = async (id) => {
        const air = (await db.user({id: id}, 'airdrop'))[0].airdrop
        const ref = (await this.getF1(id)).length
        const message = (await db.user({id: id}, 'message'))[0].message
        return {
            static: air.static,
            // messenger: air.messenger,
            // telegram: air.telegram,
            // youtube: air.youtube,
            // complete: air.complete,
            referral: ref,
            invester: air.members,
            msgId: message.messenger.id,
            tlgId: message.telegram.id,
            link_ref: {
                msg: `https://m.me/${process.env.PAGE_USERNAME}?ref=${id}`,
                tlg: `https://t.me/${process.env.TELEGRAM_BOT}?start=${id}`,
                web: `https://${process.env.host}/register?referral=${id}`
            }
        }
    }

    checkJoinTele = async (id) => {
        const tlgId = (await db.user({id: id}, 'message.telegram.id'))[0].message.telegram.id
        if (tlgId == null){ 
            return false
        }
        const res = await tlgClient.getChatMember(process.env.TELEGRAM_GROUP, tlgId)
        if (res.status == 'creator' || res.status == 'administrator' || res.status == 'member'){
            return true
        } else {
            return false
        }
    }

    checkTlg = async (id) => {
        const join = await this.checkJoinTele(id)
        const tlgId = (await db.user({id: id}, 'message.telegram.id'))[0].message.telegram.id
        if (join && tlgId !== null ){
            await db.user({id: id}, {
                $set: {
                    'airdrop.telegram': true,
                }
            })
            await this.setSocial(id)
            return {
                st: true,
                tlgId: tlgId
            }
        } else {
            return {
                st: false
            }
        }
    }

    checkMsg = async (id, like) => {
        const msgId = (await db.user({id: id}, 'message.messenger.id'))[0].message.messenger.id
        if (like && msgId !== null ){
            await db.user({id: id}, {
                $set: {
                    'airdrop.messenger': true,
                }
            })
            await this.setSocial(id)
            return {
                st: true,
                msgId: msgId
            }
        } else {
            return {
                st: false
            }
        }
    }

    checkYtb = async (id, sub) => {
        if (sub){
            await db.user({id: id}, {
                $set: {
                    'airdrop.youtube': true,
                }
            })
            await this.setSocial(id)
            return true
        } else {
            return false
        }
    }

    getStatus = async (id) => {
        const check = (await db.user({id: id}, "message airdrop"))[0]
        var msgStt, tlgStt, ytStt
        if (check.message.messenger.id == null){
            msgStt = 0
        } else {
            if (check.airdrop.messenger == false){
                msgStt = 1
            } else {
                msgStt = 2
            }
        }

        if (check.message.telegram.id == null){
            tlgStt = 0
        } else {
            if (check.airdrop.telegram == false){
                tlgStt = 1
            } else {
                tlgStt = 2
            }
        }

        if (check.airdrop.youtube == false){
            ytStt = 0
        } else {
            ytStt = 1
        }

        return {
            msgStt: msgStt,
            tlgStt: tlgStt, 
            ytStt: ytStt
        }
    }

}

const airdrop = new Airdrop()

module.exports = airdrop
!(async () =>{
    
})()