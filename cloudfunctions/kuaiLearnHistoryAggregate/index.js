const cloud = require('wx-server-sdk')
cloud.init({
  env: 'laiqiafanfan-z3fxt'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = 'kuai-learn-history'
const USERS_TABLE = 'kuai-users'
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let res = {}
  let score = 0
  try{
    console.log('event', JSON.stringify(event, null, 4))
    res = await db.collection(USERS_TABLE).where({_id: event.openid}).limit(1).get()
    console.log('userInfo', JSON.stringify(res, null, 4))
    let lastUpdate = 0
    try{
      lastUpdate = res.data[0].lastUpdate ? res.data[0].lastUpdate : 0
    }catch(e){
      console.log('not get user info with openid:', openid)
    }
    console.log('(new Date().getTime():', new Date().getTime())
    console.log('lastUpdate:', lastUpdate)
    if((new Date().getTime() - lastUpdate) > 3000){
      res = await db.collection(TABLE)
        .aggregate()
        .match({
          openid: event.openid
        })
        .group({
          _id: {
            openid: '$openid',
            nickName: '$nickName'
          },
          score: $.sum('$score')
        }).limit(1)
        // .get().then(res=>{
        .end()
      console.log('learn history aggregate res:', JSON.stringify(res, null, 4))
      score = res.list[0].score
      try {
        await db.collection(USERS_TABLE).where({ _id: event.openid })
          .update({
            data: {
              score: res.list[0].score,
              lastUpdate: new Date().getTime(),
            }
          })
      } catch (e) {
        console.log('update user with score error', JSON.stringify(e, null, 4))
      }
    }else{
      score = res.data[0].score
    }

    return {
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      score: score
    }
    //   }) 
  }catch(e){

  }
   
}