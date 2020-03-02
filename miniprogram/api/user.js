const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const TABLE = TABLES.USERS
utils.formatDate(new Date())
function queryUser(filters, callback) {
  const db = wx.cloud.database()
  // 根据条件查询所有用户
  db.collection(TABLES.USERS).where(filters).get({
    success: res => {
      let result = res.data;
      // debugLog('user', result);
      utils.runCallback(callback)(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '查询记录失败'
      })
      errorLog('[数据库USER] [查询记录] 失败：', err.stack)
    }
  })
}

function createUser(insertData, callback) {
  const db = wx.cloud.database()
  // debugLog('insertData1', insertData)
  insertData = Object.assign(insertData, {
    _id: insertData.openId
  })
  let now = new Date();
  let nowTimeString = now.toString();
  // debugLog('insertData2', insertData)
  Object.assign(insertData, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  // debugLog('insertData3', insertData)
  // 根据条件插入所有用户
  db.collection(TABLES.USERS).add({
    data: insertData,
    success: res => {
      let result = res;
      debugLog('【插入结果】user', result);
      utils.runCallback(callback)(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '插入记录失败'
      })
      debugLog('[数据库USER] [插入记录] 失败：', err.stack)
    }
  })
}

function updateUser(id, updateObj, callback) {
  const db = wx.cloud.database()
  let now = new Date();
  let nowTimeString = now.toString();

  Object.assign(updateObj, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  delete updateObj._id
  // debugLog('id', id)
  // debugLog('updateObj', updateObj)
  // 根据条件更新所有用户
  db.collection(TABLES.USERS).doc(id).update({
    data: updateObj,
    success: res => {
      let result = res;
      // debugLog('user', result);
      utils.runCallback(callback)(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '更新记录失败'
      })
      errorLog('[数据库USER] [更新记录] 失败：', err.stack)
    }
  })
}

function getUserConfigs(openid, callback) {
  const db = wx.cloud.database()
  if (!openid) {
    return
  }
  // 根据条件查询所有用户
  db.collection(TABLES.USERS).where({
    _id: openid
  }).get({
    success: res => {
      let result = res.data;
      // debugLog('getUserCofigs', result);
      if (result.length > 0) {
        utils.runCallback(callback)(result[0].userConfigs)
      } else {
        utils.runCallback(callback)(undefined)
      }

    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '查询记录失败'
      })
      errorLog('[数据库USER] [查询记录] 失败：', err.stack)
    }
  })
}

function updateUserConfigs(openid, userConfigs, callback) {
  const db = wx.cloud.database()
  let now = new Date();
  let nowTimeString = now.toString();

  let updateObj = {
    userConfigs: userConfigs,
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  }
  delete updateObj._id
  // debugLog('id', id)
  // debugLog('updateObj', updateObj)
  // 根据条件更新所有用户
  db.collection(TABLES.USERS).doc(openid).update({
    data: updateObj,
    success: res => {
      let result = res;
      // debugLog('user', result);
      utils.runCallback(callback)(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '更新记录失败'
      })
      utils.runCallback(callback)(null)
      errorLog('[数据库USER] [更新记录] 失败：', err.stack)
    }
  })
}

function getChildren(callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
  let userInfo = wx.getStorageSync('userInfo')
  let openid;

  if (userInfo && userInfo._openid) {
    openid = userInfo._openid
    // 根据条件查询所有用户
    db.collection(TABLE)
      .where({ _id: openid })
      .field({
        _id: true,
        children: true,
      })
      .get({
        success: res => {
          let result = res.data;
          if (result.length > 0) {
            // debugLog('children', result[0]);
            utils.runCallback(callback)(result[0])
          } else {
            wx.showToast({
              icon: 'none',
              title: '查询记录失败'
            })
            utils.runCallback(callback)(null)
          }

        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '查询记录失败'
          })
          callback(null)
          errorLog('[数据库] [查询记录] 失败：', err)
        }
      })
  }
}

function getParents(callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command

  let userInfo = wx.getStorageSync('userInfo')
  let openid;
  if (userInfo && userInfo._openid) {
    openid = userInfo._openid
    // 根据条件查询所有用户
    db.collection(TABLE)
      .where({ _id: openid })
      .field({
        _id: true,
        parents: true,
      })
      .get({
        success: res => {
          let result = res.data;
          if (result.length > 0) {
            // debugLog('parents', result[0]);
            utils.runCallback(callback)(result[0])
          } else {
            wx.showToast({
              icon: 'none',
              title: '查询记录失败'
            })
            utils.runCallback(callback)(null)
          }
        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '查询记录失败'
          })
          errorLog('[数据库] [查询记录] 失败：', err)
        }
      })
  }
}

module.exports = {
  queryUser: queryUser,
  createUser: createUser,
  updateUser: updateUser,
  getUserConfigs: getUserConfigs,
  updateUserConfigs: updateUserConfigs,
  getChildren: getChildren,
  getParents: getParents,
}