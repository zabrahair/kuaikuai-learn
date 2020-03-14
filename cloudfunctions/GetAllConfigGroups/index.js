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
  let rowsPerPage = event.limit ? event.limit : 100
  let pageIdx = event.pageIdx ? event.pageIdx : 0

  let result = await db.collection('configs')
    .aggregate()
    .project({
      _id: '$_id',
      data: '$$ROOT',
      type: $.arrayElemAt(['$tags', 0])
    })
    .sort({
      type: 1,
      'data.orderIdx': 1,
    })    
    .group({
      _id: '$type',
      list: $.push('$data'),
      count: $.sum(1)
    })
    .project({
      'list._id': 0,
      'list.tags': 0,
    })
    .skip(pageIdx * rowsPerPage)
    .limit(rowsPerPage)
    .end()
  console.log('Aggregate Result:', JSON.stringify(result, null, 4))
  return result;
}