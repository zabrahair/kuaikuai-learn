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
    .unwind({tags: '$tags'})
    .group({
      _id: {
        tags: '$tags'
      }
    })
    .end().then(res => {
      // debugLog('getTags[' + table + ']', res)
      callback(res)
    })
}

module.exports = {
  getTags: getTags,
}