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
  let tags;
  // let filters = event.filters
  // console.log('event.filters', JSON.stringify(event.filters, null, 4))
  try {
    let res = await db.collection(TABLE)
      .aggregate()
      .match({
        score: 1
      })
      .unwind('$tags')
      .group({
        _id: '$tags',
        count: $.sum(1)
      })
      .end()
    console.log('Chinese Words Tags aggregate res:', JSON.stringify(res, null, 4))

    if (res.list.length > 0) {
      for (let i in res.list) {
        tags.push({
          text: res.list[i]._id
          , count: res.list[i].count
        })
      }
    }
    return tags;
  } catch (e) {
    console.error(e)
  }
}