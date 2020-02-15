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

function getWords(pWhere, pageIdx, callback){
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('where', where)
  db.collection(TABLE)
    .where(pWhere)
    .skip(pageIdx * perPageCount)
    .get()
    .then
    (res => {
      // debugLog('getChineseWords', res)
      // debugLog('getChineseWords.length', res.data.length)
      if (res.data.length > 0) {
        callback(res.data, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
}

function getTags(pWhere, pageIdx, callback) {
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('where', where)
  db.collection(TABLE)
    .aggregate()
    .unwind('$tags')
    .group({
      _id: '$tags',
      count: $.sum(1)
    })
    .skip(pageIdx * perPageCount)
    .end()
    .then
    (res => {
      // debugLog('getTags', res)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        let tags = []
        for (let i in res.list) {
          tags.push({
            text: res.list[i]._id
            , count: res.list[i].count
          })
        }
        callback(tags, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
}

module.exports = {
  getTags: getTags,
  getWords: getWords,
}