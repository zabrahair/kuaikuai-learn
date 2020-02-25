const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  let table = event.table;
  let where = event.where
  let update = event.update;
  console.log('event', JSON.stringify(event, null, 4))
  if (table && table.length > 0 
    && where && Object.keys(where).length > 0 
    && update && Object.keys(update).length > 0) {
    try {
      let result = await db
        .collection(table)
        .where(where)
        .update({
          data: update
        })
      console.log('Update Result:', JSON.stringify(result, null, 4))
      return result;
    } catch (e) {
      console.error(e)
    }
  } else {
    return "Params exists error";
  }
}