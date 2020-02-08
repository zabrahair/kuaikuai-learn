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
  let pageIdx = parseInt(event.pageIdx)
  let perPageCount = 100
  console.log('event.filters', JSON.stringify(event.filters, null, 4))
  console.log('event.pageIdx', JSON.stringify(event.pageIdx, null, 4))
  try {
    let result = await db.collection(TABLE).where({
      tags: _.in(filters.tags)
    })
    .skip(perPageCount * pageIdx)
    .get()
    console.log('Chinese Words Result count:', JSON.stringify(result.data.length, null, 4))
    // console.log('Chinese Words Result count:', JSON.stringify(result, null, 4))
    return (result, pageIdx) ;
  } catch (e) {
    console.error(e)
  }
}