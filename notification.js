const DB = require('./db')
const db = new DB()
const {v4: uuidv4} = require("uuid")


const createNoti = async (id, title, event_type, data)=>{
    const notiId = uuidv4()
    console.log(notiId)
    await db.user({id:id}, {$push: {
        "info.notification":
            {
                notiId: notiId,
                title: title,
                event_type: event_type,
                data: data
            }
        }
    })
}


module.exports = createNoti
// !(async ()=>{
//     await createNoti(100000, "hello", "check", {a1: "<b>hello</b>: 4", a2: "blo"})
//     console.log("ok")
//     process.exit()
// })()