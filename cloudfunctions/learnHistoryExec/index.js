// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = 'learn-history'

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    let result = await db.collection('learn-history')
      // .doc('74b140b45e31696b0772664452d72dd8')
      .where({
        _openid: _.exists(false),
      })
      .update({
        data: {
          openid: _.rename('_openid')
        }
      })
    console.log(' learn history exec:', JSON.stringify(result, null, 4))
    return result;
  } catch (e) {
    console.error(e)
  }
}