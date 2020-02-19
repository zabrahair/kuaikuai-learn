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

    if(openid && userRole){
      let path = 'page/index/index?openid=' + openid + '&userRole=' + userRole
      const result = await cloud.openapi.wxacode.get({
        path: path,
        width: 430
      })
      console.log("result:" + JSON.stringify(result, null, 4))
      const upload = await cloud.uploadFile({
        cloudPath: 'MyQcode/' + openid + '.png',
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