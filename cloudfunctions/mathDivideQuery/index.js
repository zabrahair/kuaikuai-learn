// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = 'math-divide'

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let filters = event.filters
  console.log('event', JSON.stringify(event, null, 4))
  try {
    let result = await db.collection(TABLE).where(filters).get()
    console.log('mathDivideQuery Result:', JSON.stringify(result, null, 4))
    return result;
  } catch (e) {
    console.error(e)
  }
}