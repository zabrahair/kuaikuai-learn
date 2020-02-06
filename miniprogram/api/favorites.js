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
const TABLE = TABLES.FAVORITES

const createFavorite = function (tableName, insertData, callback) {
  const db = wx.cloud.database()
  let favorite = {
    table: tableName,
    thing: insertData,
  }
  let now = new Date();
  let nowTimeString = now.toString();
  Object.assign(favorite, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  // debugLog('favorite', favorite)
  // 根据条件插入所有用户
  db.collection(TABLE).add({
    data: favorite,
    success: res => {
      let result = res;
      debugLog('【插入结果】user', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '插入记录失败'
      })
      debugLog('[数据库USER] [插入记录] 失败：', err)
    }
  })
}

const removeFavorite = function (tableName, removeData, callback) {
  const db = wx.cloud.database()
  let _id = removeData._id
  // 根据条件插入所有用户
  db.collection(TABLE).where({
    table: tableName,
    thing: {
      _id: _id
    }
  }).remove({
    success: res => {
      let result = res;
      debugLog('【删除结果】 favorites', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '删除记录失败'
      })
      debugLog('[数据库USER] [删除记录] 失败：', err)
    }
  })
}

function getFavorites(tableName, pWhere, callback) {
  let where = _.and({
    thing: {
      tags: gConst.IS_FAVORITED
    }
  }, {
      thing: pWhere
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
  createFavorite: createFavorite,
  removeFavorite: removeFavorite,
  getFavorites: getFavorites,
}