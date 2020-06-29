const DB = require('./db')
const db = new DB()

const unixToNormal = (unix_timestamp) => {
    if (unix_timestamp == undefined){
        unix_timestamp = Number( Date.now() )
    }

    var date = new Date(unix_timestamp)
    var years = date.getFullYear()
    var months = "0" + (date.getMonth() + 1)
    var days = "0" + date.getDate()
    var hours = "0" + date.getHours()
    var minutes = "0" + date.getMinutes()
    var seconds = "0" + date.getSeconds()
    var formattedTime = years + '-' + months.substr(-2) + '-' + days.substr(-2) + ' ' + hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)
    var ms = minutes.substr(-2) + ':' + seconds.substr(-2)
    var dm = months.substr(-2) + '/' + days.substr(-2)

    return {
        seconds: date.getSeconds(),
        minutes: date.getMinutes(),
        hours: date.getHours(),
        days: date.getDate(),
        months: date.getMonth() + 1,
        years: date.getFullYear(),
        format: formattedTime,
        ms: ms,
        dm: dm
    }
}

function randString(length) {
    var result           = ''
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var characters       = 'abcdefghijklmnopqrstuvwxyz'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function randHash(length) {
    var result           = ''
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function randHashBnb(length) {
    var result           = ''
    // var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

const sameDay = (unix, k = 0) => {
    const {days, months, years} = unixToNormal()
    var inday = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if ( years % 4 == 0){
        inday[2] = 29
    }

    const past = unixToNormal(unix)
    if (k == 0){
        if (past.days == days && past.months == months && past.years == years ){
            return true
        }
    }

    if (k == 1){
        if (days !== 1){
            if (past.days == days -1 && past.months == months && past.years == years ){
                return true
            }
        } else {
            if (months !== 1){
                if (past.days == inday[months -1] && past.months == months -1 && past.years == years ){
                    return true
                }
            } else {
                if (past.days == 31 && past.months == 12 && past.years == years - 1 ){
                    return true
                }
            }
        }
    }
    return false
}

const sameMonth = (unix, k) => {
    const {months, years} = unixToNormal()
    const past = unixToNormal(unix)
    if (k == 0){
        if (past.months == months && past.years == years ){
            return true
        }
    }

    if (k ==1){
        if (months !== 1){
            if (past.months == months -1 && past.years == years ){
                return true
            }
        } else {
            if (past.months == 12 && past.years == years - 1 ){
                return true
            }
        }
    }
    return false
}

const sameAll = (unix, k) => {
    return true
}

// const elementOfObjInArrayTo = async (filter, match) => {
//     const kq = (await db.user(filter, match))[0][match]
//     return kq
// }

function random(min, max) {
    return Number((Math.random() * (max - min) + min).toFixed(0))
}

module.exports = {
    unixTo: unixToNormal,
    randStr: randString,
    randHash: randHash,
    randHashBnb: randHashBnb,
    sDay: sameDay,
    sMonth: sameMonth,
    sAll: sameAll,
    // toId: elementOfObjInArrayTo,
    random: random
}