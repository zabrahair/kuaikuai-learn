// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    let openid = event.openid
    let userRole = event.userRole
    let nickName = event.nickName

    if(openid && userRole){
      let path = 'pages/profile/profile?'
        + 'openid=' + openid 
        + '&userRole=' + userRole 
        + '&nickName=' + nickName
      const result = await cloud.openapi.wxacode.get({
        path: path,
        width: 430
      })
      console.log("result:" + JSON.stringify(result, null, 4))
      const upload = await cloud.uploadFile({
        cloudPath: 'users/qcode/' + openid + '.png',
        fileContent: result.buffer
      })
      console.log("upload:" + JSON.stringify(upload, null, 4))
      return result
    }
    return null
  } catch (err) {
    console.log(err)
    return err
  }
}