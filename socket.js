const mail = require('./mail')
const R = require("ramda")
const Redis = require("ioredis")
const {encId, decId, getId} = require('./auth')
const gg = require('./otp')
const DB = require('./db')
const db = new DB()
const redis = new Redis()
const {send, switchs, swapout, swapin, deposit} = require('./wallet')
const {create_fund, add_scale, add_no_scale} = require('./finance')
const getCoinInfo = require("./price")
const path = require("path")
const fsExtra = require("fs-extra")
const {v4: uuidv4} = require("uuid")
const { sendMap, updateMap} = require("./map.js")
const price = require('./token')
const airdrop = require('./airdrop')
const group = require('./group')
const massage = require('./push')
const {unixTo} = require('./util')
const {getPrice} = require('./func') //????????

function random(min, max) {
    return Math.random() * (max - min) + min
}
function fix_cha(str){
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\s+/g, ' ');
   str = str.trim();
   str = str.toLowerCase();
   return str;
}

module.exports = (io,siofu) => {
    
    // io.set('origins', `${process.env.host}:${process.env.http_port || process.env.PORT}`)
    io.on('connection', async (socket)=>{
        //upload file 
        const uploader = new siofu();
        uploader.dir = path.join(__dirname, "public/assets/avatars");
        uploader.maxFileSize = 1024*1024*5
        uploader.listen(socket);
        // Do something when a file is saved:
        uploader.on("start", async (e)=>{
            var filename = Date.now() + "-" + e.file.name;
            e.file.name = filename;
        })
        socket.on("uploading_avatar", async data =>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.status_upload": data
            })
        })
        socket.on("uploading_kyc", async data =>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.status_upload": data
            })
        })
        socket.on("uploading_news", async data =>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.status_upload": data
            })
        })
        socket.on("uploading_event", async data =>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.status_upload": data
            })
        })
        socket.on("uploading_docs", async data =>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.status_upload": data
            })
        })
        socket.on("uploading_edit_docs", async data =>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.status_upload": data
            })
        })
        uploader.on("saved", async (event)=>{
            const id = decId(getId(socket, 'socket'))
            var status = await db.user({id:id}, "info.status_upload")
            status = status[0].info.status_upload
            const fileName = event.file.name
            if(status === "avatar"){
                const oldImg = await db.user({id:id}, "info.avatar")
                const oldImgPath = path.join(__dirname, `public/assets/avatars/${oldImg[0].info.avatar}`)
                await db.user({id:id}, {
                    "info.avatar": fileName
                })
                if(oldImg[0].info.avatar != "default.png"){
                    await fsExtra.remove(oldImgPath)
                }
                await db.user({id:id}, {
                    "info.status_upload": ""
                })
                socket.emit("upload_avatar_success", fileName)
            }
            if(status === "kyc"){
                var failNo = Math.floor((Math.random() * 20) + 1);
                await db.user({id:id}, {$push: {"info.kyc_img": fileName}})
                var noKyc = await db.user({id:id}, "info.kyc_img info.finance_fund")
                var nost = noKyc[0].info.kyc_img.length
                await db.user({id:id}, {
                    "info.status_upload": ""
                })
                if( failNo === 4 || failNo === 7){
                    noKyc[0].info.kyc_img.forEach(async (item)=>{
                        await db.user({id:id}, {$pull: {"info.kyc_img": item}})
                        const imgpPath = path.join(__dirname, `public/assets/avatars/${item}`)
                        await fsExtra.remove(imgpPath)
                    })
                    noKyc[0].info.finance_fund.forEach(async (item)=>{
                        await db.user({id:id}, {$pull: {"info.finance_fund": {"balance": {$gte: 0}}}})
                    })
                    await db.user({id:id}, {"info.finance_total": 0})
                    socket.emit("upload_kyc_faile", nost)
                } else {                   
                    
                    socket.emit("upload_kyc_success", nost)
                }
                
            }  
            if(status === "news"){
                await db.user({id:id}, {
                    "info.status_upload": ""
                })
                socket.emit("upload_news_img_success", fileName)
            }
            if(status === "event"){
                await db.user({id:id}, {
                    "info.status_upload": ""
                })
                socket.emit("upload_event_img_success", fileName)
            }
            if(status === "doc"){
                await db.user({id:id}, {
                    "info.status_upload": ""
                })
                socket.emit("upload_docs_file_img_success", fileName)
            }
            if(status === "edit-doc"){
                await db.user({id:id}, {
                    "info.status_upload": ""
                })
                socket.emit("edit_docs_file_success", fileName)
            }
        });
        socket.on("send_ip_location", async data=>{
            const id = decId(getId(socket, 'socket'))
            await updateMap(data)
        })
        // Error handler:
        uploader.on("error", function(event){
            console.log("Error from uploader", event);
        });


        
        //Register
        socket.on('verify_email', async (data) => {
            var check_mail = await db.user({'info.email': data},'')
            if (check_mail.length == 0){
                const verify_code = random(100000, 999999).toFixed(0)
                console.log(verify_code)
                redis.set(socket.id, verify_code)
                redis.expire(socket.id, 300)
                // mail(data, verify_code)
            } else {
                socket.emit('exist_email', 'Email already exists')
            }
        })

        socket.on('verify_code', async (data) => {
            var verify_code = await redis.get(socket.id)
            if (verify_code == null){
                socket.emit('check_verify_code', 'Please provide your email address')
            } else {
                if (data !== verify_code){
                    socket.emit('check_verify_code', 'The verification code is incorrect')
                } else {
                    socket.emit('check_verify_code', 'Email verification successful')
                }
            }
        })

        //Login
        socket.on('check_email_login', async (data) => {
            var email = data.email
            var hash_md5 = data.hash_password
            var user = await db.user({'info.email': email},'info.email info.hash_password authen.login authen.select message secure.google')
            if (user.length == 0){
                socket.emit('exist_login_email', '* Email address or password is incorrect')
            } else {
                const hash_password = user[0].info.hash_password
                if (hash_md5 == decId(hash_password)){
                    var login = user[0].authen.login
                    var select = user[0].authen.select
                    var secret = user[0].secure.google
                    if (login){
                        if (select == 'google') {
                            socket.emit('exist_login_email', ' ')
                            socket.emit('require_tfa', '* Find your verification code in Google Authenticator')
                        } else {
                            // var id_message = (user[0].message)[select].id
                            // message(select, id_message, '2FA', gg.token(secret))
                            //message(app, id, event, content)
                            socket.emit('exist_login_email', ' ')
                            socket.emit('require_tfa', `* We have sent the verification code to your ${select}`)
                        }
                    } else {
                        socket.emit('exist_login_email', '')
                    }
                } else {
                    socket.emit('exist_login_email', '* Email address or password is incorrect')
                }
            }
        })

        socket.on('check_tfa', async (data) => {
            var email = data.email
            var token = data.tfa
            var user = await db.user({'info.email': email},'id')
            var id = user[0].id
            if ( await gg.check(id, token)){
                socket.emit('exist_login_email', '')
            } else {
                socket.emit('exist_login_email', '* The code entered is incorrect or has changed')
            }

        })
        //recover password
        socket.on('recover_password', async (data) => {
            var curUser = await db.user({'info.email': data},'info')
            var token_recover = uuidv4()
            token_recover = encId(token_recover)
            if (curUser){
                await db.user({'info.email': data}, {
                    "info.token_recover": token_recover
                })
                const link = `https://${process.env.host}/recover-password/${token_recover}`
                const text = `
                    <a href="${link}" style="padding: 5px; background: transparent; border: solid 1px yellow; color: yellow; margin: 20px;">Change Password</a>
                `
                mail(data, text)
            }
        })
        socket.on('change_password_recover', async (data)=>{
            const userId = data.userId
            const password = encId(data.password)
            const curUser = await db.user({"info.token_recover": userId}, 'info')
            if(curUser.length > 0) {
                await db.user({"info.token_recover": userId}, {
                    "info.hash_password": password,
                    "info.token_recover": null
                })
                socket.emit("change_password_recover_success", "Change password success")
            }else{
                socket.emit("user_not_found","User not found")
            }
        })
        //Wallet
        socket.on('balance', async (data) => {
            // Them phan Switch
            const id = decId(getId(socket, 'socket'))
            console.log(data)
            if (data.action == 'withdraw'){
                var user = await db.user({id: id},'authen.withdraw authen.select message secure.google')
                var withdraw = user[0].authen.withdraw
                // var select = user[0].authen.select
                // var secret = user[0].secure.google
                if (withdraw){
                    if (await gg.check(id, data.auth)){
                        var tx
                        if ( (data.address).toString().length < 34 ){
                            //Switch
                            tx = await switchs(id, data.address, data.symbol, data.amount)
                        } else {
                            tx = await send(id, data.symbol, data.address, data.amount, data.memo)
                        }
                        if (typeof tx == 'string'){
                            socket.emit('send-err-balance', {
                                error: tx,
                                symbol: data.symbol
                            })
                        } else {
                            const priceFFT = await getPrice('FFT')
                            tx.priceFFT = priceFFT
                            socket.emit('send-err-balance', tx)
                        }
                    } else {
                        socket.emit('send-err-balance', {
                            error: 'auth',
                            symbol: data.symbol
                        })
                    }
                } else {
                    var tx
                    if ( (data.address).toString().length < 34 ){
                        //Switch
                        tx = await switchs(id, data.address, data.symbol, data.amount)
                    } else {
                        tx = await send(id, data.symbol, data.address, data.amount, data.memo)
                    }
                    if (typeof tx == 'string'){
                        socket.emit('send-err-balance', {
                            error: tx,
                            symbol: data.symbol
                        })
                    } else {
                        // console.log(tx)
                        const priceFFT = await getPrice('FFT')
                        tx.priceFFT = priceFFT
                        socket.emit('send-err-balance', tx)
                    }
                }
            } else {
                // Xu ly swap Coin
                if (data.symbol !== 'FFT'){
                    const tx = await swapin(id, data.symbol, data.amount)
                    if (typeof tx == 'string'){
                        socket.emit('send-err-balance', {
                            error: tx,
                            symbol: data.symbol
                        })
                    } else {
                        const priceFFT = await getPrice('FFT')
                        tx.priceFFT = priceFFT
                        socket.emit('send-err-balance', tx)
                    }
                } else {
                    const tx = await swapout(id, data.to, data.amount)
                    if (typeof tx == 'string'){
                        socket.emit('send-err-balance', {
                            error: tx,
                            symbol: data.symbol
                        })
                    } else {
                        const priceFFT = await getPrice('FFT')
                        tx.priceFFT = priceFFT
                        socket.emit('send-err-balance', tx)
                    }
                }
            }
        })

        //get coin info
        getCoinInfo("BTC", socket)
        getCoinInfo("ETH", socket)
        getCoinInfo("BNB", socket)
        getCoinInfo("BCH", socket)
        getCoinInfo("EOS", socket)
        getCoinInfo("XRP", socket)
        getCoinInfo("LTC", socket)
        getCoinInfo("DASH", socket)
        getCoinInfo("LINK", socket)
        getCoinInfo("XTZ", socket)
        getCoinInfo("ZEC", socket)
        getCoinInfo("ETC", socket)


        //manage finance
        socket.on("finance_kyc", async(data)=>{
            const id = decId(getId(socket, 'socket'))
            socket.emit("finance_kyc_open", "Start KYC Your Finance Management")
        })

        socket.on("add_sump_event",async (data) => {
            const id = decId(getId(socket, 'socket'))
            const hisId = uuidv4()
            data.hisId = hisId
            await add_no_scale(id, data.type, data.value*(-1))
            await db.user({id:id}, {$inc: {"info.finance_total": - data.value}})
            await db.user({id:id}, {$push: {"info.finance_history": data}})

            const user = await db.user({id: id}, 'info.finance_fund info.finance_total')
            const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
            const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
            const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
            const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
            const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
            const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
            const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
            const user_fin = {
                total: user[0].info.finance_total,
                Sump: Sump,
                Edu: Edu,
                Inv: Inv,
                Play: Play,
                Save: Save,
                Loan: Loan,
                Debt: Debt,
                newHistory: data
            }
            socket.emit("add_sump_success", user_fin)
        })
        socket.on("add_loan_event",async (data) => {
            const id = decId(getId(socket, 'socket'))
            const hisId = uuidv4()
            data.hisId = hisId
            await add_no_scale(id, data.type, data.value)
            if( data.type === "DEBT"){
                await add_no_scale(id,"SAVE", data.value)
                await db.user({id:id}, {$inc: {"info.finance_total": - data.value}})
            }else{
                await add_no_scale(id,"SAVE", (data.value)*(-1))
                await db.user({id:id}, {$inc: {"info.finance_total": + data.value}})

            }
            
            await db.user({id:id}, {$push: {"info.finance_history": data}})

            const user = await db.user({id: id}, 'info.finance_fund info.finance_total')
            const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
            const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
            const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
            const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
            const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
            const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
            const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
            const user_fin_loan = {
                total: user[0].info.finance_total,
                Sump: Sump,
                Edu: Edu,
                Inv: Inv,
                Play: Play,
                Save: Save,
                Loan: Loan,
                Debt: Debt,
                newHistory: data
            }
            socket.emit("add_loan_success", user_fin_loan)
        })

        socket.on("add_inc_event",async (data) => {
            const id = decId(getId(socket, 'socket'))
            const hisId = uuidv4()
            data.hisId = hisId
            await add_scale(id, data.value)
            await db.user({id:id}, {$inc: {"info.finance_total": + data.value}})
            await db.user({id:id}, {$push: {"info.finance_history": data}})

            const user = await db.user({id: id}, 'info.finance_fund info.finance_total')
            const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
            const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
            const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
            const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
            const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
            const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
            const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
            const user_fin_inc = {
                total: user[0].info.finance_total,
                Sump: Sump,
                Edu: Edu,
                Inv: Inv,
                Play: Play,
                Save: Save,
                Loan: Loan,
                Debt: Debt,
                newHistory: data
            }
            socket.emit("add_inc_success", user_fin_inc)
        })

        socket.on("swap_fund_event", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            await add_no_scale(id, data.from, data.value)
            await add_no_scale(id, data.to, (data.value)*(-1))
            const user = await db.user({id: id}, 'info.finance_fund info.finance_total')
            const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
            const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
            const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
            const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
            const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
            const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
            const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
            const user_fin_swap = {
                total: user[0].info.finance_total,
                Sump: Sump,
                Edu: Edu,
                Inv: Inv,
                Play: Play,
                Save: Save,
                Loan: Loan,
                Debt: Debt,
                newHistory: data
            }
            socket.emit("swap_fund_success", user_fin_swap)
        })

        socket.on("fix_his_event", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            const userHis = await db.user({id:id}, "info.finance_history")
            const oldVal = R.filter( n => n.hisId == data.hisId, userHis[0].info.finance_history).pop().value

            const newhis = {
                hisId: data.hisId,
                type: data.type,
                title: data.des,
                value: data.value,
                date: data.date
            }
            if( data.type === 'INC'){
                await add_scale(id, (data.value-oldVal))
                await db.user({id:id}, {$inc: {"info.finance_total": + (data.value-oldVal)}})
            }else if( data.type === 'LOAN' || data.type === 'DEBT'){
                await add_no_scale(id, data.type, (data.value-oldVal))
                if( data.type === "LOAN"){
                    await add_no_scale(id,"SAVE", (oldVal-data.value))
                    await db.user({id:id}, {$inc: {"info.finance_total": + (oldVal- data.value)}})
                }else{
                    await add_no_scale(id,"SAVE", (data.value-oldVal))
                    await db.user({id:id}, {$inc: {"info.finance_total": + (data.value-oldVal)}})
                }
            } else {
                await add_no_scale(id, data.type, (oldVal-data.value))
                await db.user({id:id}, {$inc: {"info.finance_total": + (oldVal-data.value)}})
            }
            await db.user({id: id}, {$pull: {"info.finance_history": {"_id": data.id}}})
            await db.user({id: id}, {$push: {"info.finance_history": newhis}})
            const user = await db.user({id: id}, 'info.finance_fund info.finance_total')
            const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
            const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
            const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
            const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
            const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
            const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
            const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
            const user_fin_fix = {
                total: user[0].info.finance_total,
                Sump: Sump,
                Edu: Edu,
                Inv: Inv,
                Play: Play,
                Save: Save,
                Loan: Loan,
                Debt: Debt,
                newHistory: newhis
            }
            socket.emit("fix_event_success", user_fin_fix)
        })

        socket.on("del_his_event", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            if( data.type === 'INC'){
                await add_scale(id, (data.value)*(-1))
                await db.user({id:id}, {$inc: {"info.finance_total": + (data.value)*(-1)}})
            }else if( data.type === 'LOAN' || data.type === 'DEBT'){
                await add_no_scale(id, data.type, (data.value)*(-1))
                if( data.type === "LOAN"){
                    await add_no_scale(id,"SAVE", data.value)
                    await db.user({id:id}, {$inc: {"info.finance_total": - data.value}})
                }else{
                    await add_no_scale(id,"SAVE", (data.value)*(-1))
                    await db.user({id:id}, {$inc: {"info.finance_total": + data.value}})

                }
            } else {
                await add_no_scale(id, data.type, data.value)
                await db.user({id:id}, {$inc: {"info.finance_total": + data.value}})
            }
            await db.user({id: id}, {$pull: {"info.finance_history": {"hisId": data.hisId}}})
            const user = await db.user({id: id}, 'info.finance_fund info.finance_total')
            const Sump = R.filter( n => n.name == 'SUMP', user[0].info.finance_fund).pop().balance
            const Edu = R.filter( n => n.name == 'EDU', user[0].info.finance_fund).pop().balance
            const Inv = R.filter( n => n.name == 'INV', user[0].info.finance_fund).pop().balance
            const Play = R.filter( n => n.name == 'PLAY', user[0].info.finance_fund).pop().balance
            const Save = R.filter( n => n.name == 'SAVE', user[0].info.finance_fund).pop().balance
            const Loan = R.filter( n => n.name == 'LOAN', user[0].info.finance_fund).pop().balance
            const Debt = R.filter( n => n.name == 'DEBT', user[0].info.finance_fund).pop().balance
            const user_fin_del = {
                total: user[0].info.finance_total,
                Sump: Sump,
                Edu: Edu,
                Inv: Inv,
                Play: Play,
                Save: Save,
                Loan: Loan,
                Debt: Debt,
                newHistory: data
            }
            socket.emit("del_event_success", user_fin_del)
        })
        //end finance socket

        //start profile socket
        //mobile
        socket.on("add_mobile_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.mobile": data
            })
            socket.emit("add_mobile_success", data)
        })
        socket.on("update_mobile_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.mobile": data
            })
            socket.emit("update_mobile_success", data)
        })
        //village
        socket.on("add_village_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.village": fix_cha(data)
            })
            socket.emit("add_village_success", fix_cha(data))
        })
        socket.on("update_village_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.village": fix_cha(data)
            })
            socket.emit("update_village_success", fix_cha(data))
        })
        //district
        socket.on("add_district_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.district": fix_cha(data)
            })
            socket.emit("add_district_success", fix_cha(data))
        })
        socket.on("update_district_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.district": fix_cha(data)
            })
            socket.emit("update_district_success", fix_cha(data))
        })
        //description
        socket.on("add_about_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.about": fix_cha(data)
            })
            socket.emit("add_about_success", fix_cha(data))
        })
        socket.on("update_about_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.about": fix_cha(data)
            })
            socket.emit("update_about_success", fix_cha(data))
        })
        //city
        socket.on("add_city_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.city": fix_cha(data)
            })
            socket.emit("add_city_success", fix_cha(data))
        })
        socket.on("update_city_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.city": fix_cha(data)
            })
            socket.emit("update_city_success", fix_cha(data))
        })
        //job
        socket.on("add_job_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.job": fix_cha(data)
            })
            socket.emit("add_job_success", fix_cha(data))
        })
        socket.on("update_job_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.job": fix_cha(data)
            })
            socket.emit("update_job_success", fix_cha(data))
        })
        //name
        socket.on("add_name_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.first_name": fix_cha(data)
            })
            socket.emit("add_name_success", fix_cha(data))
        })
        socket.on("update_name_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.first_name": fix_cha(data)
            })
            socket.emit("update_name_success", fix_cha(data))
        })
        //country
        socket.on("update_country_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.country": data
            })
            socket.emit("update_country_success", data)
        })
        //gender
        socket.on("update_gender_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.gender": data
            })
            socket.emit("update_gender_success", data)
        })
        //birthday
        socket.on("update_bd_event", async data=>{
            const id = decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.birthday": data
            })
            socket.emit("update_bd_success", data)
        })

        //kyc pages
        socket.on("add_kyc_info_event", async data=>{
            const id =decId(getId(socket, 'socket'))
            await db.user({id:id}, {
                "info.first_name": fix_cha(data.Fname),
                "info.last_name": fix_cha(data.Lname),
                "info.job": fix_cha(data.job),
                "info.mobile": data.phone,
                "info.gender": data.gender,
                "info.village": fix_cha(data.village),
                "info.district": fix_cha(data.district),
                "info.city": fix_cha(data.city),
                "info.country": data.country,
                "info.country_code": data.country_code,
                "info.birthday": data.bd,
            })
            
            socket.emit("step1_success", true)
        })
        

        socket.on("add_kyc_finance_event", async data=>{
            const id =decId(getId(socket, 'socket'))
            await create_fund(id)
            await add_scale(id, data)
            await db.user({id:id}, {$inc: {"info.finance_total": + data}})
            socket.emit("step2_success", true)
        })

        //helper page
        socket.on("send_helper_start", async (data) => {
            const id =decId(getId(socket, 'socket'))
            const helperId = uuidv4()
            data.helperId = helperId
            await db.user({id:id}, {$push: {"info.helper_array": data}})
            socket.emit("send_helper_success", true)
        })

        //see all notifications
        socket.on("click-noti-event", async data=>{
            const id= decId(getId(socket, 'socket'))
            await db.user({id:id, "info.notification.notiId": data}, {$set: {"info.notification.$.status" : true}})
            socket.emit("click-noti-success", data)
        })

        //post news
        socket.on('upload_news_content', async(data) => {
            data.newsId = uuidv4()
            data.writer = decId(getId(socket, 'socket'))
            await db.paper(data)
            socket.emit("upload_content_success", data.newsId)
        })
        socket.on('end_upload_news', async(data) => {
            await db.paper({newsId: data.id}, {
                "img": data.fileName
            })
        })
        //post event
        socket.on('upload_event_content', async(data) => {
            data.eventId = uuidv4()
            await db.event(data)
            socket.emit("upload_event_content_success", data.eventId)
        })
        socket.on('end_upload_event', async(data) => {
            await db.event({eventId: data.id}, {
                "img": data.fileName
            })
        })
        socket.on("remove_event", async(data) => {
            await db.Event.findOneAndRemove({eventId: data})
            socket.emit("remove_event_success", data)
        })
        //post document
        socket.on('upload_docs_content', async(data) => {
            data.docId = uuidv4()
            data.sub = fix_cha(data.sub)
            await db.doc(data)
            socket.emit("upload_docs_content_success", data.docId)
        })
        socket.on('end_upload_docs', async(data) => {
            await db.doc({docId: data.id}, {
                "link": data.fileName
            })
        })
        //edit document
        socket.on('edit_docs_content', async(data) => {
            data.sub = fix_cha(data.sub)
            await db.doc({docId: data.docId}, {
                typeDoc: data.typeDoc,
                sub: data.sub
            })
            socket.emit("edit_docs_content_success", data.docId)
        })
        socket.on('end_edit_docs', async(data) => {
            const oldFile = await db.doc({docId:data.docId}, "link")
            const oldFilePath = path.join(__dirname, `public/assets/avatars/${oldFile[0].link}`)
            await fsExtra.remove(oldFilePath)
            await db.doc({docId: data.docId}, {
                link: data.fileName
            })
        })
        //map
        setInterval(async ()=>{
            await sendMap(socket)
            function generateData(baseval, count, yrange) {
                var i = 0;
                var series = [];
                while (i < count) {
                  //var x =Math.floor(Math.random() * (750 - 1 + 1)) + 1;;
                  var y =
                    Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
                  var z = Math.floor(Math.random() * (75 - 15 + 1)) + 15;
            
                  series.push([baseval, y, z]);
                  baseval += 86400000;
                  i++;
                }
                return series;
            }
            var data_1 = generateData(new Date().getTime(), 30, {
                min: 10,
                max: 90
              })
            var data_2 = generateData(new Date().getTime(), 30, {
                min: 10,
                max: 90
              })
            var data_3 = generateData(new Date().getTime(), 30, {
                min: 10,
                max: 90
              })
            var data_4 = generateData(new Date().getTime(), 30, {
                min: 10,
                max: 90
              })
            socket.emit("ai_traning", {data_1, data_2, data_3, data_4})
        },1000)    

        //admin deposit setting
        socket.on("change_deposit_btc_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.deposit.btc": false})
            }else{
                await db.admin({role: "admin"}, {"settings.deposit.btc": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.deposit")
            socket.emit("change_deposit_btc_setting_success", new_data[0].settings.deposit.btc)
        })
        socket.on("change_deposit_eth_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.deposit.eth": false})
            }else{
                await db.admin({role: "admin"}, {"settings.deposit.eth": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.deposit")
            socket.emit("change_deposit_eth_setting_success", new_data[0].settings.deposit.eth)
        })
        socket.on("change_deposit_bnb_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.deposit.bnb": false})
            }else{
                await db.admin({role: "admin"}, {"settings.deposit.bnb": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.deposit")
            socket.emit("change_deposit_bnb_setting_success", new_data[0].settings.deposit.bnb)
        })
        socket.on("change_deposit_usdt_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.deposit.usdt": false})
            }else{
                await db.admin({role: "admin"}, {"settings.deposit.usdt": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.deposit")
            socket.emit("change_deposit_usdt_setting_success", new_data[0].settings.deposit.usdt)
        })
        socket.on("change_deposit_fft_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.deposit.fft": false})
            }else{
                await db.admin({role: "admin"}, {"settings.deposit.fft": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.deposit")
            socket.emit("change_deposit_fft_setting_success", new_data[0].settings.deposit.fft)
        })
        //admin withdraw setting
        socket.on("change_withdraw_btc_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.withdraw.btc": false})
            }else{
                await db.admin({role: "admin"}, {"settings.withdraw.btc": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.withdraw")
            socket.emit("change_withdraw_btc_setting_success", new_data[0].settings.withdraw.btc)
        })
        socket.on("change_withdraw_eth_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.withdraw.eth": false})
            }else{
                await db.admin({role: "admin"}, {"settings.withdraw.eth": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.withdraw")
            socket.emit("change_withdraw_eth_setting_success", new_data[0].settings.withdraw.eth)
        })
        socket.on("change_withdraw_bnb_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.withdraw.bnb": false})
            }else{
                await db.admin({role: "admin"}, {"settings.withdraw.bnb": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.withdraw")
            socket.emit("change_withdraw_bnb_setting_success", new_data[0].settings.withdraw.bnb)
        })
        socket.on("change_withdraw_usdt_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.withdraw.usdt": false})
            }else{
                await db.admin({role: "admin"}, {"settings.withdraw.usdt": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.withdraw")
            socket.emit("change_withdraw_usdt_setting_success", new_data[0].settings.withdraw.usdt)
        })
        socket.on("change_withdraw_fft_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.withdraw.fft": false})
            }else{
                await db.admin({role: "admin"}, {"settings.withdraw.fft": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.withdraw")
            socket.emit("change_withdraw_fft_setting_success", new_data[0].settings.withdraw.fft)
        })
        //admin login setting
        socket.on("change_login_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.login": false})
            }else{
                await db.admin({role: "admin"}, {"settings.login": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.login")
            socket.emit("change_login_setting_success", new_data[0].settings.login)
        })
        //admin register setting
        socket.on("change_register_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.register": false})
            }else{
                await db.admin({role: "admin"}, {"settings.register": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.register")
            socket.emit("change_register_setting_success", new_data[0].settings.register)
        })
        //admin swap setting
        socket.on("change_swap_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.swap": false})
            }else{
                await db.admin({role: "admin"}, {"settings.swap": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.swap")
            socket.emit("change_swap_setting_success", new_data[0].settings.swap)
        })
        //admin hft setting
        socket.on("change_hft_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.hft": false})
            }else{
                await db.admin({role: "admin"}, {"settings.hft": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.hft")
            socket.emit("change_hft_setting_success", new_data[0].settings.hft)
        })
        //admin airdrop setting
        socket.on("change_airdrop_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.airdrop": false})
            }else{
                await db.admin({role: "admin"}, {"settings.airdrop": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.airdrop")
            socket.emit("change_airdrop_setting_success", new_data[0].settings.airdrop)
        })
        //admin web setting
        socket.on("change_web_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.web": false})
            }else{
                await db.admin({role: "admin"}, {"settings.web": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.web")
            socket.emit("change_web_setting_success", new_data[0].settings.web)
        })
        //admin dashboard setting
        socket.on("change_dashboard_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.dashboard": false})
            }else{
                await db.admin({role: "admin"}, {"settings.dashboard": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.dashboard")
            socket.emit("change_dashboard_setting_success", new_data[0].settings.dashboard)
        })
        //admin delete setting
        socket.on("change_delete_setting", async (data)=>{
            if(data == "off"){
                await db.admin({role: "admin"}, {"settings.delete": false})
            }else{
                await db.admin({role: "admin"}, {"settings.delete": true})
            }
            var new_data = await db.admin({role: "admin"}, "settings.delete")
            socket.emit("change_delete_setting_success", new_data[0].settings.delete)
        })
        //user phone setting
        socket.on("change_phone_notice_setting", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            if(data == "off"){
                await db.user({id: id}, {"message.phone.status": false})
            }else{
                await db.user({id: id}, {"message.phone.status": true})
            }
            var user = await db.user({id: id}, "message.phone")
            socket.emit("change_phone_notice_setting_success", user[0].message.phone.status)
        })
        //user messenger setting
        socket.on("change_messenger_notice_setting", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            if(data == "off"){
                await db.user({id: id}, {"message.messenger.status": false})
            }else{
                await db.user({id: id}, {"message.messenger.status": true})
            }
            var user = await db.user({id: id}, "message.messenger")
            socket.emit("change_messenger_notice_setting_success", user[0].message.messenger.status)
        })
        //user telegram setting
        socket.on("change_telegram_notice_setting", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            if(data == "off"){
                await db.user({id: id}, {"message.telegram.status": false})
            }else{
                await db.user({id: id}, {"message.telegram.status": true})
            }
            var user = await db.user({id: id}, "message.telegram")
            socket.emit("change_telegram_notice_setting_success", user[0].message.telegram.status)
        })
        //user website setting
        socket.on("change_website_notice_setting", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            if(data == "off"){
                await db.user({id: id}, {"message.website.status": false})
            }else{
                await db.user({id: id}, {"message.website.status": true})
            }
            var user = await db.user({id: id}, "message.website")
            socket.emit("change_website_notice_setting_success", user[0].message.website.status)
        })
        //2fa setting on
        socket.on("setting_2fa_event", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            var user = (await db.user({id: id}, "info"))[0]
            if(data.pass != decId(user.info.hash_password)){
                socket.emit("pass_2fa_false", "Your Password Incorrect")
            }else{
                const check = await gg.check(id, data.code)
                if(check == true){
                    await db.user({id:id}, {"secure.status": true})
                    await db.user({id:id}, {"authen.select": "google"})
                    socket.emit("setting_2fa_success", "Enable Google Authencator Success")
                }else{
                    socket.emit("setting_2fa_faile", "The Code In Correct or Expired")
                }
            }
        })
        //2fa setting off
        socket.on("setting_off_2fa_event", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            var user = (await db.user({id: id}, "info"))[0]
            if(data.pass_off != decId(user.info.hash_password)){
                socket.emit("pass_off_2fa_false", "Your Password Incorrect")
            }else{
                const check = await gg.check(id, data.code_off)
                if(check == true){
                    await db.user({id:id}, {"secure.status": false})
                    await db.user({id:id}, {"authen.select": null})
                    await db.user({id:id}, {"authen.login": false})
                    await db.user({id:id}, {"authen.withdarw": false})
                    socket.emit("setting_off_2fa_success", "Disable Google Authencator Success")
                }else{
                    socket.emit("setting_off_2fa_faile", "The Code In Correct or Expired")
                }
            }
        })
        //2fa login
        socket.on("login_2fa_setting_event", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            var user = (await db.user({id: id}, "info"))[0]
            if(data.pass_login != decId(user.info.hash_password)){
                socket.emit("pass_login_2fa_false", "Your Password Incorrect")
            }else{
                if(data.value == "on"){
                    await db.user({id: id}, {"authen.login": false})
                }else{
                    await db.user({id: id}, {"authen.login": true})
                }
                var user = (await db.user({id: id}, "authen"))[0]
                socket.emit("login_2fa_setting_event_success", user.authen.login)
            }
        })
        //2fa withdraw
        socket.on("withdraw_2fa_setting_event", async (data)=>{
            const id= decId(getId(socket, 'socket')) 
            var user = (await db.user({id: id}, "info"))[0]
            if(data.pass_withdraw != decId(user.info.hash_password)){
                socket.emit("pass_withdraw_2fa_false", "Your Password Incorrect")
            }else{
                if(data.value == "on"){
                    await db.user({id: id}, {"authen.withdraw": false})
                }else{
                    await db.user({id: id}, {"authen.withdraw": true})
                }
                var user = (await db.user({id: id}, "authen"))[0]
                socket.emit("withdraw_2fa_setting_event_success", user.authen.withdraw)
            }
        })
        //change T wallet admin
        socket.on("change_t_wallet", async (data)=>{
            if(data.type == "btc"){
                await db.admin({role: "admin"}, {"wallet.t.btc": data.address})
            }
            if(data.type == "eth"){
                await db.admin({role: "admin"}, {"wallet.t.eth": data.address})
            }
            if(data.type == "bnb"){
                await db.admin({role: "admin"}, {"wallet.t.bnb": data.address})
            }
            if(data.type == "usdt"){
                await db.admin({role: "admin"}, {"wallet.t.usdt": data.address})
            }
            socket.emit("change_t_wallet_success", true)
        })
        //change M wallet admin
        socket.on("change_m_wallet", async (data)=>{
            if(data.type == "btc"){
                await db.admin({role: "admin"}, {"wallet.m.btc": data.address})
            }
            if(data.type == "eth"){
                await db.admin({role: "admin"}, {"wallet.m.eth": data.address})
            }
            if(data.type == "bnb"){
                await db.admin({role: "admin"}, {"wallet.m.bnb": data.address})
            }
            if(data.type == "usdt"){
                await db.admin({role: "admin"}, {"wallet.m.usdt": data.address})
            }
            socket.emit("change_m_wallet_success", true)
        })
        //change L wallet admin
        socket.on("change_l_wallet", async (data)=>{
            if(data.type == "btc"){
                await db.admin({role: "admin"}, {"wallet.l.btc": data.address})
            }
            if(data.type == "eth"){
                await db.admin({role: "admin"}, {"wallet.l.eth": data.address})
            }
            if(data.type == "bnb"){
                await db.admin({role: "admin"}, {"wallet.l.bnb": data.address})
            }
            if(data.type == "usdt"){
                await db.admin({role: "admin"}, {"wallet.l.usdt": data.address})
            }
            socket.emit("change_l_wallet_success", true)
        })
        //admin submit kyc
        socket.on("a_submit_kyc", async (data)=>{
            await db.user({_id: data}, {"info.kyc": true})
            socket.emit("a_submit_kyc_success", data)
        })
        //admin delete user
        socket.on("a_del_user", async (data)=>{
            await airdrop.deleteUser(id)
            socket.emit("a_del_user_success", data)
        })
        //admin refuse kyc
        socket.on("a_refuse_kyc", async (data)=>{
            var user = (await db.user({_id:data}, "info.kyc_img info.finance_fund"))[0]
            for(var i = 0; i < user.info.kyc_img.length; i++){
                await db.user({_id:data}, {$pull: {"info.kyc_img": user.info.kyc_img[i]}})
                var imgPath = path.join(__dirname, `public/assets/avatars/${user.info.kyc_img[i]}`)
                await fsExtra.remove(imgPath)
            }
            for(var j = 0; j < user.info.finance_fund.lenth; j++){
                await db.user({_id:data}, {$pull: {"info.finance_fund": {"balance": {$gte: 0}}}})
            }
            await db.user({_id:data}, {"info.finance_total": 0})
            socket.emit("a_refuse_kyc_success", data)
        })
        //change password
        socket.on("change_pass_event", async (data)=>{
            const id= decId(getId(socket, 'socket'))
            var user= (await db.user({id: id}, "info"))[0]
            if(data.oldPass != decId(user.info.hash_password)){
                socket.emit('change_pass_err', "Password is Incorrect")
            }else{
                if(data.newPass == data.re_newPass){
                    await db.user({id:id}, {"info.hash_password": encId(data.newPass)})
                    socket.emit("change_pass_event_success", "Change Password Success")
                }else{
                    socket.emit("change_pass_confirm_error",'Comfirm New password Error')
                }
            }
        })
        //join group
        socket.on("join_group", async (data)=>{
            const id= decId(getId(socket, 'socket'))
            const result = await group.join(id, data)
            console.log((await group.listMember(id)))
            if(result == true){
                socket.emit("join_group_success", {note: "You Joined A Group Success", listMem: (await group.listMember(id))})
            }else{
                socket.emit("join_group_err", "Join Group Faile, Please Try Again")
            }
        })
        socket.on("remove_mem", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            const role = (await db.user({id: id}, 'role'))[0].role
            if(role == "leader" || role == "admin"){
                await group.deleteMember(id, data.groupId, data.userId)
                socket.emit("remove_mem_success", data.userId)
            }else{
                socket.emit("remove_mem_err", "Remove Member Error, You aren't A Leader")
            }
        })
        //edit group
        socket.on("change_group_name_event", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            await group.editName(id, data.groupId, data.name)
            socket.emit("change_group_name_event_success", {note: "Change Group Name Success", newName: data.name})
        })
        socket.on("change_group_location_event", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            await group.editOffline(id, data.groupId, data.location)
            socket.emit("change_group_location_event_success", {note:"Change Group Offline Location Success", newLocation: data.location})
        })
        socket.on("change_group_time_event", async (data)=>{
            const id = decId(getId(socket, 'socket'))
            await group.editTime(id, data.groupId, data.time)
            socket.emit("change_group_time_event_success", {note:"Change Offline Time Success", newTime: data.time})
        })
        //Chart Lai moi lenh
        const series = (await price.liveOrder()).series
        socket.emit('startChart', series)

        // Chart Lai Moi Ngay
        const sys = (await db.system({}, 'profitDaily pay'))[0]
        var record = sys.profitDaily.slice(sys.profitDaily.length - 16, sys.profitDaily.length)
        var pay = sys.pay.slice(sys.pay.length - 16, sys.pay.length)

        var record_value = [], record_label = [], pay_value = []

        for ( var i = 0; i <16; i++){
            record_value.push(Number(record[i].value).toFixed(2))
            pay_value.push(Number(pay[i].value).toFixed(2))

            record_label.push(unixTo(record[i].timestamp).dm)
        }

        socket.emit('daily_chart', {
            pay_value: pay_value,
            record_label: record_label,
            record_value: record_value
        })

        socket.on('create_token_msg', async () => {
            const id = decId(getId(socket, 'socket'))
            const code = await airdrop.newCode(id)
            socket.emit('receive_token_msg', code)
        })

        socket.on('create_token_tlg', async () => {
            const id = decId(getId(socket, 'socket'))
            const code = await airdrop.newCode(id)
            socket.emit('receive_token_tlg', code)
        })

        socket.on('fbinfo', async (data) => {
            const id = decId(getId(socket, 'socket'))
            await db.user({id: id}, {
                $set: {
                    'info.fb': {
                        name: data.name,
                        id: data.id
                    }
                }
            })
        })

        socket.on('check_msg', async (like) => {
            const id = decId(getId(socket, 'socket'))
            const kq = await airdrop.checkMsg(id, like)
            socket.emit('res_check_msg', kq)
        })

        socket.on('check_tlg', async () => {
            const id = decId(getId(socket, 'socket'))
            const kq = await airdrop.checkTlg(id)
            socket.emit('res_check_tlg', kq)
        })

        socket.on('calculator', async (data) => {
            const res = await price.calculate(data.amount, data.symbol, data.period)
            socket.emit('complete_calculator', res)
        })

        //deposit to user
        socket.on("deposit_to_user", async (data) => {
            await deposit(data.id, data.symbol, data.amount)
            socket.emit("deposit_to_user_success", `deposit to id: ${data.id} success`)
        })
        //set event awards
        socket.on("a_set_event_mg", async (data)=>{
            await group.setEvent(data.i_top, data.i_unit, data.i_value, data.s_top, data.s_unit, data.s_value, data.g_top, data.g_unit, data.g_value, data.g_leader)
            socket.emit("a_set_event_mg_success", "Set Event Success")
        })
    })
}