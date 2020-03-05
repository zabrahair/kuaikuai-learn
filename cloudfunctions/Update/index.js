const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg'
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

// 云函数入口函数
exports.main = async (event, context) => {
  let table = event.table;
  let pWhere = event.where
  let pUpdate = event.update;
  let where = Object.assign({
  }, pWhere)
  let now = new Date();
  let update = Object.assign({
    updateTimestamp: now.getTime(),
    updateLocalTime: formatTime(now)
  }, pUpdate)

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