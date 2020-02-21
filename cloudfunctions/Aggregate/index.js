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
  if (table && table.length > 0 ){
    let rowsPerPage = event.limit ? event.limit : 100
    let pageIdx = event.pageIdx ? event.pageIdx : 0
    let result = await db.collection(table)
      .aggregate()
      .group({
        _id: '$word',
        count: $.sum(1),
        tags: $.push('$tags'),
        // "近义词": $.push(''),
        "近义词": $.push($.cond({
          if: $.gt([$.size('$近义词'), 0]),
          then: '$近义词',
          else: '',
        })),
        "反义词": $.push($.cond({
          if: $.gt([$.size('$反义词'), 0]),
          then: '$反义词',
          else: '',
        })),
        ids: $.push('$_id')
      })
      .match({
        count: $.gt(1)
      })
      .project({
        _id: 1,
        count: 1,
        tags: $.setUnion('$tags'),
        "近义词": $.setUnion('$近义词'),
        "反义词": $.setUnion('$反义词'),
        ids: 1
      })
      .project({
        _id: 1,
        count: 1,
        tags: 1,
        "近义词": $.cond({
          if: $.eq(['$近义词', ['']]),
          then: false,
          else: '$近义词'
        }),
        "反义词": $.cond({
          if: $.eq(['$反义词', ['']]),
          then: false,
          else: '$反义词'
        }),
        ids: 1
      })
      .skip(pageIdx * rowsPerPage)
      .limit(rowsPerPage)
      .end()
    console.log('Aggregate Result:', JSON.stringify(result, null, 4))
    return result;
  } else {
    return null;
  }
}