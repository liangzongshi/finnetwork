const DB = require('./db')
const db = new DB()

createNoti = async (id, data)=>{
    await db.user({id:id}, {$push: {"info.notification": data}})
}


countNoti = async (id, type)=>{
    const user = await db.user({id:id}, "info")
    const countType = user[0].info.notification.filter(n => n.type == type).length
    return countType
}

module.exports = {
    createNoti,
    countNoti
}