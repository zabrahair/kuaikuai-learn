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
const TABLE = TABLES.CONFIGS



function getConfigs(pWhere, pageIdx, callback) {
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('where', where)
  db.collection(TABLE)
    .where(where)
    .skip(pageIdx * perPageCount)
    .get({
      success: res => {
        let result = res.data;
        // debugLog('getConfigs.result', result);
        callback(result, pageIdx)

      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        errorLog('[数据库configs] [查询记录] 失败：', err)
      }
    })
}

module.exports = {
  getConfigs: getConfigs,
  USER_ROLE_TAG: 'USER_ROLE',
}