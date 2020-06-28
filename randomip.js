const { sendMap,updateMap} = require("./map")
const rp = require("request-promise")
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
setInterval(()=>{
    updateMap2(`${getRandomInt(1,223)}.${getRandomInt(0,255)}.${getRandomInt(0,255)}.${getRandomInt(0,255)}`);//us
},1000)

updateMap2 = async (data)=>{
  var uri = `https://geolocation-db.com/json/${data}`;
  rp({
      uri: uri,
      headers: {
          'User-Agent': 'Request-Promise'
      },
      json: true
  }, async (error,response,body)=>{
      if (!error && response.statusCode === 200) {
          await updateMap(body)
  }});
}
// updateMap2("220.81.143.9")