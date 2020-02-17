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
  const wxContext = cloud.getWXContext()
  let table = event.table;
  let where = event.where
  let rowsPerPage = 100
  let pageIdx = event.pageIdx
  console.log('event', JSON.stringify(event, null, 4))
  try {
    let result = await db.collection(table)
      .where(where)
      .skip(pageIdx * rowsPerPage)
      .limit(rowsPerPage)
      .get()
    console.log('Query Result:', JSON.stringify(result, null, 4))
    return result;
  } catch (e) {
    console.error(e)
  }
}