const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const dbApi = require('db.js')

const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = TABLES.CHINESE_WORDS


function getTags(pWhere,callback) {
  debugLog('pWhere', pWhere)
  let where = pWhere
  debugLog('where', where)
  db.collection(TABLE)
    .aggregate()
    .match(pWhere)
    .unwind('$tags')
    .group({
      _id: '$tags',
      count: $.sum(1)
    })
    .end().then
    (res => {
      debugLog('getTags', res)
      if(res.list.length > 0){
        let tags = []
        for(let i in res.list){
          tags.push({
            text: res.list[i]._id
            , count: res.list[i].count
          })
        }
        callback(tags)
        return
      }else{
        callback([])
      }
    })
}

module.exports = {
  getTags: getTags,
}