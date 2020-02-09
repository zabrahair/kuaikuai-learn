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
const TABLE = TABLES.CHINESE_KNOWLEDGE



function query(pWhere, pageIdx, callback) {
  dbApi.query(TABLE, pWhere, pageIdx, res=>{
    
  })
  db.collection(TABLE).get({
    success: res => {
      let result = res.data;
      // debugLog('res', result);
      if (result.length > 0) {
        callback(result)
      } else {
        callback(undefined)
      }

    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '查询记录失败'
      })
      errorLog('[数据库favorites] [查询记录] 失败：', err)
    }
  })
}

module.exports = {
  query: query,
}