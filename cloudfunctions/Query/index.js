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
  console.log('event', JSON.stringify(event, null, 4))
  let table = event.table;
  let pWhere = event.where
  let where = Object.assign({
    // _id: _.exists(true)
  }, pWhere)

  if(table && table.length > 0 && where){
    let rowsPerPage = event.limit ? event.limit : 100
    let pageIdx = event.pageIdx ? event.pageIdx : 0
    let field = event.field ? event.field : {}
    
    try {
      let result = await db.collection(table)
        .where(where)
        .field(field)
        .skip(pageIdx * rowsPerPage)
        .limit(rowsPerPage)
        .get()
      console.log('Query Result:', JSON.stringify(result, null, 4))
      return result;
    } catch (e) {
      console.error(e)
    }
  }else{
    return null;
  }

}