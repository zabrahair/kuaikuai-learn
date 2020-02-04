const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = 'learn-history'
const USERS_TABLE = 'users'
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
      let groupOptions = event.groupOptions
      let matchOptions = event.matchOptions

      if (!groupOptions){
        groupOptions = {
          _id: {
            openid: '$openid',
            nickName: '$nickName'
          },
          score: $.sum($.sum(['$question.score', '$score'])),
          avgThinkTime: $.avg('$thinkSeconds'),
        }
      }

      if (!matchOptions) {
        matchOptions = {
          openid: event.openid
        }
      }

      console.log('groupOptions', JSON.stringify(groupOptions, null, 4))
      console.log('matchOptions', JSON.stringify(matchOptions,null,4))

      res = await db.collection(TABLE)
        .aggregate()
        .match(matchOptions)
        .group(groupOptions)
        .limit(1)
        .end()
      console.log('learn history aggregate res:', JSON.stringify(res, null, 4))
      try{
        score = res.list[0].score
      }catch(e){
        console.log('no learn history records:', JSON.stringify(res, null, 4))
      }
      
      try {
        await db.collection(USERS_TABLE).where({ _id: event.openid })
          .update({
            data: {
              score: score,
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
      score: score,
      data: res,
    }
    //   }) 
  }catch(e){

  }
   
}