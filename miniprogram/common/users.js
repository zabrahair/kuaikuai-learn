const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const media = require('../utils/media.js');
const TABLES = require('../const/collections.js')
// Api Handler
const dbApi = require('../api/db.js')
const userApi = require('../api/user.js')

/**
 * 获取用户所有的关系人
 */
function getRelationships(that, callback){
  let userInfo = utils.getUserInfo(null)
  let relationships = [{
    name: userInfo.nickName,
    openid: userInfo.openId
  }]

  // children
  userApi.getChildren(res => {
    // debugLog('getChildren', res)
    if (res.children) {
      relationships = that.data.relationships ? that.data.relationships : relationships
      that.setData({
        relationships: relationships.concat(res.children),
        curRelationship: relationships[0],
        curRelationshipIdx: 0,
      }
        , () => {
          // debugLog('getChildren.assignees', that.data.assignees)
          utils.runCallback(callback)(that)
        })
    }
  })

  // parents
  userApi.getParents(res => {
    if (res.parents) {
      // debugLog('getParents', res)
      let relationships = that.data.relationships ? that.data.relationships : relationships
      that.setData({
        relationships: relationships.concat(res.parents),
        curRelationship: relationships[0],
        curRelationshipIdx: 0,
      }, () => {
        // debugLog('getParents.assignees', that.data.assignees)
        // debugLog('getParents.parents', that.data.parents)
        utils.runCallback(callback)(that)
      })
    }
  })
}

/**
 * 获取其他人的UserInfo
 */
function getOtherUserInfo(openid, callback){
  wx.cloud.callFunction({
    name: 'Query',
    data: {
      table: TABLES.USERS,
      where: {
        _id: openid,
      },
      limit: 1,
      pageIdx: 0,
    },
    success: res => {
        debugLog('getOtherUserInfo.res', res)
      try {
        if(res.result.data.length > 0){
          utils.runCallback(callback)(res.result.data[0])
        }
      } catch (err) {
        utils.runCallback(callback)(null)
      }

    },
    fail: err => {
      errorLog('getOtherUserInfo.err', err)
    }
  })
}

module.exports = {
  getRelationships: getRelationships,
  getOtherUserInfo: getOtherUserInfo,
}