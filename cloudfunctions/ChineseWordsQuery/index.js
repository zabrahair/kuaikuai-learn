// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = 'chinese-words'

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let filters = event.filters
  console.log('event.filters', JSON.stringify(event.filters, null, 4))
  try {
    let result = await db.collection(TABLE).where({
      tags: _.all(filters.tags)
    }).get()
    console.log('Chinese Words Result count:', JSON.stringify(result.data.length, null, 4))
    // console.log('Chinese Words Result count:', JSON.stringify(result, null, 4))
    return result;
  } catch (e) {
    console.error(e)
  }
}