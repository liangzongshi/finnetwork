require('dotenv').config()
const R = require('ramda')
const DB = require('./db')
const db = new DB()
const {add_wallet} = require('./wallet')
const tree = require('./tree')
const {encId, decId, getId} = require('./auth')
const gg = require('./otp')
const {create_fund, add_scale, add_no_scale} = require('./finance')
const fsExtra = require('fs-extra')
const path = require('path')
const { createNoti, countNoti } = require('./notification')
const {random} = require('./util')
const price = require('./token')
const airdrop = require('./airdrop')
const group = require('./group')
const massage = require('./push')
const {unixTo} = require('./util')
const {getPrice} = require('./func')

const Redis = require("ioredis")
const { CLOSING } = require('ws')
const redis = new Redis()

function xoa_dau(str){
    str = str.replace(/\s+/g, ' ');
   str = str.trim();
   str = str.toLowerCase();
   str = str.split(' ').join("-")
   return str;
}

module.exports = (app, io) => {
    app.get('/register', async (req, res) => {
        if ( !!getId(req,'') ){
            res.redirect('/invest')
            return
        }
        res.render('register', { referral: req.query.referral })
    })

    app.get('/login', async (req, res) => {
        if ( !!getId(req,'') ){
            res.redirect('/invest')
            return
        }
        res.render('login')
    })

    app.post('/invest', async (req, res) => {
        const sign = req.body
        if (sign.code !== undefined){
            sign.hash_password = encId(sign.re_password)
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
                // const tx = ''
                await changeBalanceWallet(id, 'FFT', 25, 0, 'deposit', tx)
                await changeBalanceWallet(referral, 'FFT', 25, 0, 'deposit', tx)
            }
            
            req.session.user = {
                id: encId(id),
            }

            const user = await db.user({id: id}, "info")

            const capitalTotal = await price.capitalTotal(id)
            const salesTotal = await price.salesTotal(id)
            const check_package = (await tree.check_package(id)).package
            const assetsTotal = await price.assetsTotal(id)
            const assetsTotalPast = await price.assetsTotal(id, 1)
            const profitTotal = await price.profitTotal(id)
            const salesRefTotal = await price.salesRefTotal(id)
            const totalByTime = await price.totalByTime(id)
            const totalByTimePast = await price.totalByTime(id, 1)
            const priceFFT = await getPrice('FFT')

            res.render('invest', {
                title: "DIGIGO | Investment",
                userInfo: user[0].info,
                role: user[0].role,
                id: id,

                capitalTotal: capitalTotal,
                check_package: check_package,
                salesTotal: salesTotal,
                assetsTotal: assetsTotal,
                profitTotal: profitTotal,
                salesRefTotal: salesRefTotal,
                totalByTime: totalByTime,
                totalByTimePast: totalByTimePast,
                priceFFT: priceFFT,
                assetsTotalPast: assetsTotalPast
            })
            
        } else {
            const email = sign.login_email
            const hash_md5 = sign.cef
            var user = await db.user({'info.email': email},'id info.email info.hash_password')
            if (user.length == 0){
                res.redirect('/login')
            } else {
                const hash_password = user[0].info.hash_password
                const id = user[0].id
                if (hash_md5 == decId(hash_password)){
                    req.session.user = {
                        id: encId(id),
                    }
                    const idNow = decId(getId(req,''))
                    const user = await db.user({id: idNow}, "info")

                    const capitalTotal = await price.capitalTotal(idNow)
                    const salesTotal = await price.salesTotal(idNow)
                    const check_package = (await tree.check_package(idNow)).package
                    const assetsTotal = await price.assetsTotal(idNow)
                    const assetsTotalPast = await price.assetsTotal(id, 1)
                    const profitTotal = await price.profitTotal(idNow)
                    const salesRefTotal = await price.salesRefTotal(idNow)
                    const totalByTime = await price.totalByTime(idNow)
                    const totalByTimePast = await price.totalByTime(idNow, 1)
                    const priceFFT = await getPrice('FFT')

                    res.render('invest', {
                        title: "DIGIGO | Invest",
                        userInfo: user[0].info,
                        role: user[0].role,
                        id: idNow,

                        capitalTotal: capitalTotal,
                        check_package: check_package,
                        salesTotal: salesTotal,
                        assetsTotal: assetsTotal,
                        profitTotal: profitTotal,
                        salesRefTotal: salesRefTotal,
                        totalByTime: totalByTime,
                        totalByTimePast: totalByTimePast,
                        priceFFT: priceFFT,
                        assetsTotalPast: assetsTotalPast
                    })
                } else {
                    res.redirect('/login')
                }
            }
        }
    })

    app.get('/invest', async (req, res) => {
        
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info")

            const capitalTotal = await price.capitalTotal(id)
            const salesTotal = await price.salesTotal(id)
            const check_package = (await tree.check_package(id)).package
            const assetsTotal = await price.assetsTotal(id)
            const assetsTotalPast = await price.assetsTotal(id, 1)
            const profitTotal = await price.profitTotal(id)
            const salesRefTotal = await price.salesRefTotal(id)
            const totalByTime = await price.totalByTime(id)
            const totalByTimePast = await price.totalByTime(id, 1)
            const priceFFT = await getPrice('FFT')


            res.render('invest', {
                title: "DIGIGO | Investment",
                userInfo: user[0].info,
                role: user[0].role,
                id: id,

                capitalTotal: capitalTotal,
                check_package: check_package,
                salesTotal: salesTotal,
                assetsTotal: assetsTotal,
                profitTotal: profitTotal,
                salesRefTotal: salesRefTotal,
                totalByTime: totalByTime,
                totalByTimePast: totalByTimePast,
                priceFFT: priceFFT,
                assetsTotalPast: assetsTotalPast
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/trading', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            const curOrders = await price.trading(timeskip = 0)
            const preOrders = await price.trading(timeskip = 1)
            const hftOrders = await price.liveOrder()
            const current_profit = await redis.get('profitDay')

            // io.emit('startChart', hftOrders.series)
            // var kk = req.app.get('socketio')
            // kk.emit('startChart', 'Luna')
            res.render('trading', {
                title: "FINFINE | Trading",
                userInfo: user[0].info,
                role: user[0].role,
                curOrders: curOrders,
                preOrders: preOrders,
                hftOrders: hftOrders,
                current_profit: current_profit
            })
        } else {
            const curOrders = await price.trading(timeskip = 0)
            const preOrders = await price.trading(timeskip = 1)
            const hftOrders = await price.liveOrder()
            const current_profit = await redis.get('profitDay')

            // io.emit('startChart', hftOrders.series)
            // var kk = req.app.get('socketio')
            // kk.emit('startChart', 'Luna')
            res.render('trading', {
                title: "FINFINE | Trading",
                userInfo: null,
                role: "user",
                curOrders: curOrders,
                preOrders: preOrders,
                hftOrders: hftOrders,
                current_profit: current_profit
            })
        }
    })

    app.get('/timeline', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info role')
            const timeline = await tree.upTime(id , "two")
            res.render('timeline', {
                title: "FINFINE | Timeline",
                userInfo: user[0].info,
                role: user[0].role,
                timeline: timeline
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/market', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('market', {
                title: "FINFINE | Market",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/balance', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info currency role')
            const currencies = user[0].currency
            const priceArr = [Number(await getPrice('BTC')), Number(await getPrice('ETH')), Number(await getPrice('USDT')), Number(await getPrice('FFT')), Number(await getPrice('BNB'))]
            res.render('balance', {
                title: "FINFINE | Balance",
                userInfo: user[0].info,
                role: user[0].role,
                currencies: currencies,
                price: priceArr
            })    
        } else {
            res.redirect('/login')
        }
    })

    app.get('/deposit', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info history role')
            const deposit = R.filter( n => n.type == 'deposit', user[0].history)
            res.render('deposit', {
                title: "FINFINE | Deposit",
                userInfo: user[0].info,
                role: user[0].role,
                deposit: deposit
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/withdraw', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info history role')
            const withdraw = R.filter( n => n.type == 'withdraw', user[0].history)
            res.render('withdraw', {
                title: "FINFINE | Withdraw",
                userInfo: user[0].info,
                role: user[0].role,
                withdraw: withdraw
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/swap', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info history role')
            const swap = R.filter( n => n.type == 'swapin' || n.type == 'swapout', user[0].history)
            res.render('swap', {
                title: "FINFINE | Swap",
                userInfo: user[0].info,
                role: user[0].role,
                swap: swap
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/switch', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info role history')
            const switchHis = R.filter( n => n.type == 'switchin' || n.type == 'switchout', user[0].history)
            res.render('switch', {
                title: "FINFINE | Switch",
                userInfo: user[0].info,
                role: user[0].role,
                switchHis: switchHis
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/mybonus', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info role')
            const mybonus = await group.getListBonus(id)
            res.render('mybonus', {
                title: "FINFINE | My Bonus",
                userInfo: user[0].info,
                role: user[0].role,
                mybonus: mybonus
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/bonus', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info role')
            const bonus = (await group.getBonus())[(await group.getBonus()).length - 1]
            const time = (bonus != undefined ? (await unixTo(bonus.timestamp)).months: new Date().getMonth() + 1)
            res.render('bonus', {
                title: "FINFINE | Bonus",
                userInfo: user[0].info,
                role: user[0].role,
                bonus: bonus,
                time: time
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/airdrop', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")

            const stt = await airdrop.getStatus(id)
            const info = await airdrop.getAll(id)

            res.render('airdrop', {
                title: "FINFINE | Airdrop",
                userInfo: user[0].info,
                role: user[0].role,
                info: info,
                stt: stt
            })

        } else {
            res.redirect('/login')
        }
    })

    app.get('/finance', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, 'info role')
            var user_fin 
            if(user[0].info.kyc === true){
                const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
                const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
                const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
                const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
                const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
                const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
                const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
                const histories = user[0].info.finance_history.sort((a,b)=> a.date-b.date)
                user_fin = {
                    total: user[0].info.finance_total,
                    Sump: Sump,
                    Edu: Edu,
                    Inv: Inv,
                    Play: Play,
                    Save: Save,
                    Loan: Loan,
                    Debt: Debt,
                    histories: histories
                }
            }
            
            res.render('finance', {
                "title": "FINFINE | Finance Management",
                userInfo: user[0].info,
                role: user[0].role,
                UserFinance: user_fin
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/news/:page', async (req, res) => {
        var perPage = 9
        var page = req.params.page || 1
        const posts = await db.Paper.find({}).skip((perPage * page) - perPage).limit(perPage)
        posts.forEach(async (post) => {
            post.link = await xoa_dau(post.sub)
            var byUser = await db.user({id: post.writer}, "info.first_name info.last_name")
            post.by = byUser[0].info.first_name + " " + byUser[0].info.last_name
        })
        const count = await db.Paper.countDocuments({})
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('news', {
                title: "FINFINE | News",
                userInfo: user[0].info,
                role: user[0].role,
                posts: posts,
                current: page,
                pages: Math.ceil(count / perPage)
            })
        } else {
            res.redirect('/login')
        }
    })
    app.get('/details/:news', async (req,res)=>{
        const nid = (req.params.news).split('-.-')[1]
        const currentNews = await db.Paper.findOne({newsId: nid})
        const byUser = await db.user({id: currentNews.writer}, "info.first_name info.last_name")
        currentNews.by = byUser[0].info.first_name + " " + byUser[0].info.last_name
        const nextNews = await db.Paper.findOne({_id: {$gt: currentNews._id}}).sort({_id: 1})
        const prevNews = await db.Paper.findOne({_id: {$lt: currentNews._id}}).sort({_id: -1})
        const linkCurrent = xoa_dau(currentNews.sub)
        const posts = await db.Paper.find({}).limit(5)
        posts.forEach(async (post) => {
            post.link = await xoa_dau(post.sub)
        })
        var linkNext, linkPrev
        if(nextNews != null){
            linkNext = xoa_dau(nextNews.sub)
        }
        if(prevNews != null){
            linkPrev = xoa_dau(prevNews.sub)
        }
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('details', { 
                title: "FINFINE | " + currentNews.sub,
                role: user[0].role,
                userInfo: user[0].info,
                currentNews: currentNews,
                nextNews: nextNews,
                prevNews: prevNews,
                linkPrev: linkPrev,
                linkNext: linkNext,
                linkCurrent: linkCurrent,
                posts: posts
             })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/upload', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            if(user[0].role === "editor" || user[0].role === "admin"){
                res.render('upload', {
                    title: "FINFINE | Upload News",
                    userInfo: user[0].info,
                    role: user[0].role
                })
            }else{
                res.redirect('/invest')
            }
            
        } else {
            res.redirect('/login')
        }
    })
    app.get('/tree', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            const view_child = await tree.view_child(id)

            res.render('tree', {
                title: "FINFINE | Tree",
                userInfo: user[0].info,
                role: user[0].role,
                org: view_child.orgArr
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/list', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")

            const view_child = await tree.view_child(id)

            res.render('list', {
                title: "FINFINE | Lists",
                userInfo: user[0].info,
                role: user[0].role,

                diagram: view_child.diagram,
                detail: view_child.detail,
                org: view_child.org
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/map', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('map', {
                title: "FINFINE | Map",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/group', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            const listGroup = await group.listGroup(id)
            const listMem = await group.listMember(id)
            res.render('group', {
                title: "Finfine | Group",
                userInfo: user[0].info,
                role: user[0].role,
                listGroup: listGroup,
                listMem: listMem
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/events/:page', async (req, res) => {
        var perPage = 8
        var page = req.params.page || 1
        const events = await db.Event.find({}).skip((perPage * page) - perPage).limit(perPage)
        events.forEach(async (event) => {
            event.link = await xoa_dau(event.title)
        })
        const count = await db.Event.countDocuments({})
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('events', {
                title: "FINFINE | News",
                userInfo: user[0].info,
                role: user[0].role,
                events: events,
                current: page,
                pages: Math.ceil(count / perPage)
            })
        } else {
            res.redirect('/login')
        }
    })
    app.get('/details-event/:event', async (req,res)=>{
        const eid = (req.params.event).split('-.-')[1]
        const currentEvent = await db.Event.findOne({eventId: eid})
        const nextEvent = await db.Event.findOne({_id: {$gt: currentEvent._id}}).sort({_id: 1})
        const prevEvent = await db.Event.findOne({_id: {$lt: currentEvent._id}}).sort({_id: -1})
        const linkCurrent = xoa_dau(currentEvent.title)
        const events = await db.Event.find({}).limit(5)
        events.forEach(async (event) => {
            event.link = await xoa_dau(event.title)
        })
        var linkNext, linkPrev
        if(nextEvent != null){
            linkNext = xoa_dau(nextEvent.title)
        }
        if(prevEvent != null){
            linkPrev = xoa_dau(prevEvent.title)
        }
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('details-event', { 
                title: "FINFINE | " + currentEvent.title,
                role: user[0].role,
                userInfo: user[0].info,
                currentEvent: currentEvent,
                nextEvent: nextEvent,
                prevEvent: prevEvent,
                linkPrev: linkPrev,
                linkNext: linkNext,
                linkCurrent: linkCurrent,
                events: events
             })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/top', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            const topGroup = (await group.topGroup()).slice(0,100)
            const topInvester = (await group.topInvester()).slice(0,100)
            const topSaler = (await group.topSaler()).slice(0,100)
            res.render('top', {
                title: "FINFINE | Top",
                userInfo: user[0].info,
                role: user[0].role,
                topGroup: topGroup,
                topInvester: topInvester,
                topSaler: topSaler
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/token', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id:id}, "info role")

            const current_price = await getPrice('FFT')
            const column = await price.column()   
            const pie = await price.pie()

            res.render('token', {
                title: "FINFINE | Token",
                userInfo: user[0].info,
                role: user[0].role,
                current_price: current_price,
                series: column.series,
                label: column.label,
                pie: pie
            })
            
        } else {
            res.redirect('/login')
        }
    })

    app.get('/follow', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('follow', {
                title: "FINFINE | Follow",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/livestream', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('livestream', {
                title: "FINFINE | Livestream",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/generalinformation/:page', async (req, res) => {
        var perPage = 8
        var page = req.params.page || 1
        await db.Doc.deleteMany({"link": null})
        const docs = await db.Doc.find({typeDoc: "general"}).skip((perPage * page) - perPage).limit(perPage)
        const count = await db.Doc.countDocuments({typeDoc: "general"})
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('generalinformation', {
                title: "FINFINE | General Information",
                userInfo: user[0].info,
                role: user[0].role,
                docs: docs,
                current: page,
                pages: Math.ceil(count / perPage)
            })
        } else {
            res.redirect('/login')
        }
    })
    app.get('/upload-document', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            await db.Doc.deleteMany({"link": null})
            if(user[0].role === "editor" || user[0].role === "admin"){
                res.render('upload-document', {
                    title: "FINFINE | Upload Document",
                    userInfo: user[0].info,
                    role: user[0].role
                })
            }else{
                res.redirect('/invest')
            }
            
        } else {
            res.redirect('/login')
        }
    })
    app.get('/edit-document/:docId', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            await db.Doc.deleteMany({"link": null})
            const docId = req.params.docId
            const doc = await db.Doc.findOne({docId: docId})
            if(user[0].role === "editor" || user[0].role === "admin"){
                res.render('edit-document', {
                    title: "FINFINE | Edit Document",
                    userInfo: user[0].info,
                    role: user[0].role,
                    doc: doc
                })
            }else{
                res.redirect('/invest')
            }
            
        } else {
            res.redirect('/login')
        }
    })

    app.get('/financialreport/:page', async (req, res) => {
        var perPage = 8
        var page = req.params.page || 1
        await db.Doc.deleteMany({"link": null})
        const docs = await db.Doc.find({typeDoc: "report"}).skip((perPage * page) - perPage).limit(perPage)
        const count = await db.Doc.countDocuments({typeDoc: "report"})
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('financialreport', {
                title: "FINFINE | Finance Reports",
                userInfo: user[0].info,
                role: user[0].role,
                docs: docs,
                current: page,
                pages: Math.ceil(count / perPage)
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/marketing/:page', async (req, res) => {
        var perPage = 8
        var page = req.params.page || 1
        await db.Doc.deleteMany({"link": null})
        const docs = await db.Doc.find({typeDoc: "marketing"}).skip((perPage * page) - perPage).limit(perPage)
        const count = await db.Doc.countDocuments({typeDoc: "marketing"})
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id:id}, "info role")
            res.render('marketing', {
                title: "FINFINE | Marketing",
                userInfo: user[0].info,
                role: user[0].role,
                docs: docs,
                current: page,
                pages: Math.ceil(count / perPage)
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/ai', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id:id}, "info role")
            res.render('ai', {
                title: "FINFINE | AI",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/helper', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id:id}, "info role")
            res.render('helper', {
                title: "FINFINE | Helper",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/securitynotice', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = (await db.user({id: id}, "info role message secure authen"))[0]
            const qr_2fa = await gg.get(id)
            res.render('securitynotice', {
                title: "Finfine | Security Notice",
                userInfo: user.info,
                role: user.role,
                settings: user.message,
                secure: user.secure,
                qr_2fa: qr_2fa,
                authen: user.authen
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/profit', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = (await db.user({id: id}, "info role received"))[0]
            res.render('profit', {
                title: "FINFINE | Profit",
                userInfo: user.info,
                role: user.role,
                profit: user.received
            })
        } else {
            res.redirect('/login')
        }
    })


    app.get('/myprofile', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role secure auth")
            res.render('myprofile', {
                title: "Finfine | Profile",
                userInfo: user[0].info,
                role: user[0].role,
                secure: user[0].secure
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/kyc', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            if(user[0].info.kyc === false && user[0].info.kyc_img.length < 3){
                user[0].info.kyc_img.forEach(async (item)=>{
                    await db.user({id:id}, {$pull: {"info.kyc_img": item}})
                    const imgpPath = path.join(__dirname, `public/assets/avatars/${item}`)
                    await fsExtra.remove(imgpPath)
                })
                user[0].info.finance_fund.forEach(async (item)=>{
                    await db.user({id:id}, {$pull: {"info.finance_fund": {"balance": {$gte: 0}}}})
                })
                await db.user({id:id}, {$set: {"info.finance_total": 0}})
            }
            res.render('kyc', {
                title: "FINFINE | KYC",
                userInfo: user[0].info,
                role: user[0].role
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/limitfees', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            const level = await tree.limit(id)
            res.render('limitfees', {
                title: "Finfine | Limit And Fees",
                userInfo: user[0].info,
                role: user[0].role,
                level: level
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/delete', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            res.render('delete')
        } else {
            res.redirect('/login')
        }
    })

    app.get('/seeall', async (req, res) => {
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            const allNoti = (await R.filter( n => n.status == false, user[0].info.notification)).length
            res.render('seeall', {
                title: "FINFINE | See All",
                userInfo: user[0].info,
                role: user[0].role,
                allNoti: allNoti
            })
        } else {
            res.redirect('/login')
        }
    })

    app.get('/recover', async (req,res)=>{
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('recover', { 
                title: "Finfine | Recover Password ",
                userInfo: user[0].info,
                role: user[0].role
             })
        } else {
            res.render('recover', { 
                title: "Finfine | Recover Password ",
                userInfo: null
             })
        }
    })
    app.get('/recover-password/:id', async (req, res) => {
        const curUserId = req.params.id;
        if ( !!getId(req,'') ){
            res.redirect('/invest')
            return
        }
        res.render('new-password', {
            userId: curUserId,
        })
    })
    app.get('/logout', async (req, res) => {
        req.session.destroy((err) => {
            res.redirect('/login')
        })
    })


    //home routes
    app.get('/', async (req, res) => {
        const fft = await getPrice("FFT")
        const curOrders = await price.trading(timeskip = 0)
        const preOrders = await price.trading(timeskip = 1)
        const hftOrders = await price.liveOrder()
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/index', { 
                title: "Finfine | Home ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft,
                curOrders: curOrders,
                preOrders: preOrders,
                hftOrders: hftOrders
             })
        } else {
            res.render('home/index', { 
                title: "Finfine | Home ",
                userInfo: null,
                fft:fft,
                curOrders: curOrders,
                preOrders: preOrders,
                hftOrders: hftOrders
             })
        }
    })
    app.get('/about', async (req,res)=>{
        const fft = await getPrice("FFT")
        const curOrders = await price.trading(timeskip = 0)
        const preOrders = await price.trading(timeskip = 1)
        const hftOrders = await price.liveOrder()
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/company/about', { 
                title: "Finfine | About Us ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft,
                curOrders: curOrders,
                preOrders: preOrders,
                hftOrders: hftOrders
             })
        } else {
            res.render('home/company/about', { 
                title: "Finfine | About Us ",
                userInfo: null,
                fft:fft,
                curOrders: curOrders,
                preOrders: preOrders,
                hftOrders: hftOrders
             })
        }
    })
    app.get('/help', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/company/help', { 
                title: "Finfine | Help Center",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/company/help', { 
                title: "Finfine | Help Center",
                userInfo: null,
                fft:fft
             })
        }
    })
    app.get('/service', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/company/service', { 
                title: "Finfine | Our Services  ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/company/service', { 
                title: "Finfine | Our Services  ",
                userInfo: null,
                fft:fft
             })
        }
    })
    app.get('/team', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/company/team', { 
                title: "Finfine | Our Team ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/company/team', { 
                title: "Finfine | Our Team ",
                userInfo: null,
                fft:fft
             })
        }
    })

    //stock routes
    app.get('/stock', async (req, res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/stock/stock', { 
                title: "Finfine | Stock ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/stock/stock', { 
                title: "Finfine | Stock ",
                userInfo: null,
                fft:fft
             })
        }
    })

    //product routes
    app.get('/platform', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/product/platform', { 
                title: "Finfine | FinFine Platform ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/product/platform', { 
                title: "Finfine | FinFine Platform ",
                userInfo: null,
                fft:fft
             })
        }
    })
    app.get('/exchange', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/product/exchange', { 
                title: "Finfine | Exchange ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/product/exchange', { 
                title: "Finfine | Exchange ",
                userInfo: null,
                fft:fft
             })
        }
    })
    app.get('/bot', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/product/bot', { 
                title: "Finfine | FinFineBot ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/product/bot', { 
                title: "Finfine | FinFineBot ",
                userInfo: null,
                fft:fft
             })
        }
    })
    //fund routes
    app.get('/term', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/fund/term', { 
                title: "Finfine | Terms And Conditions ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/fund/term', { 
                title: "Finfine | Terms And Conditions ",
                userInfo: null,
                fft:fft
             })
        }
    })
    app.get('/invest-info', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/fund/invest', { 
                title: "Finfine | Investment Information ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/fund/invest', { 
                title: "Finfine | Investment Information ",
                userInfo: null,
                fft:fft
             })
        }
    })

    app.get('/partner', async (req,res)=>{
        const fft = await getPrice("FFT")
        if ( !!getId(req,'') ){
            const id = decId(getId(req,''))
            const user = await db.user({id: id}, "info role")
            res.render('home/fund/partner', { 
                title: "Finfine | Partner ",
                userInfo: user[0].info,
                role: user[0].role,
                fft: fft
             })
        } else {
            res.render('home/fund/partner', { 
                title: "Finfine | Partner ",
                userInfo: null,
                fft:fft
             })
        }
    })

    app.get('/test', async (req, res) => {
            const user = await db.user({id: 100003}, "info")
            res.render('test', {
                title: "FINFINE | Tree",
                userInfo: user[0].info
            })
    })

    app.get('/set', async (req, res) => {
        req.session.user = {
            id: encId(req.query.id),
        }
        res.redirect('/trading')
    })
}