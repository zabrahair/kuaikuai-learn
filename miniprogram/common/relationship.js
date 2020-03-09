const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js')
// Api Handler
const dbApi = require('../api/db.js')
const userApi = require('../api/user.js')
const configsApi = require('../api/configs.js')
const dialogCommon = require('../common/dialog.js')

var USER_ROLES = [].concat(wx.getStorageSync(gConst.USER_ROLES_OBJS_KEY))
USER_ROLES.splice(USER_ROLES.length - 1, 1)
const USER_ROLES_OBJ = utils.array2Object(USER_ROLES, 'value')
const USER_ROLES_NAME_OBJ = utils.array2Object(USER_ROLES, 'name')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

/**
 * 初始化页面
 */
function initPage(that, callback) {
  // userInfo
  let userInfo = utils.getUserInfo(globalData)
  // userRole
  let userRole = userInfo.userRole
  that.setData({
    userInfo: userInfo,
    openid: userInfo.openId,
    userRole: userInfo.userRole,
    USER_ROLES: USER_ROLES,
    USER_ROLES_NAME_OBJ: USER_ROLES_NAME_OBJ,
    USER_ROLES_OBJ: USER_ROLES_OBJ,
  }
  , () => {
    // 设置完成后回调
    utils.runCallback(callback)()
  })
}

/**
 * 当对话框打开时
 */
function whenIsShown(that) {
  let userInfo = that.data.userInfo
  try {
    let userRole = that.data.USER_ROLES_NAME_OBJ[that.data.options.userRole]
    delete userRole._id
    delete userRole.vertifyCode

    that.setData({
      curRelationship: {
        nickName: that.data.options.nickName,
        origUserRole: userRole,
        openid: that.data.options.openid,
        name: that.data.options.nickName,
        userRole: userRole,
      }
    }, ()=>{
      // debugLog('USER_ROLES', that.data.USER_ROLES)
      // debugLog('curRelationship', that.data.curRelationship)
    })
  } catch (err) { errorLog('err', err.stack) }

}

/**
 * 初始化关系对话框
 */
function initCreator(that, callback) {
  initPage(that, callback)
}

/**
 * 更新关系到用户数据库
 */
function updateRelationship(that, callback){
  userApi.queryUser({
    _id: that.data.userInfo.openId
  }, result => {
    // debugLog('queryUserResult', result)
    // If not found the user insert a new one.
    if (result.length <= 0) {
      wx.navigateTo({
        url: 'pages/register/register'
      })
    } else {
      let curUser = result[0]
      debugLog('curUser', curUser)
      let curRelationship = that.data.curRelationship
      let updateData = {}
      debugLog('curRelationship', curRelationship)
      switch (curRelationship.userRole.value){
        case 'STUDENT':
          let children = curUser.children
          if (children && children.length > 0){
            let isExisted = false
            for(let i in children){
              if (children[i].openid == curUser.openId){
                isExisted = true
                Object.assign(children[i], curRelationship)
                break;
              }
            }
            if (!isExisted){
              children.push(curRelationship)
            }
          }else{
            children = [curRelationship.userRole]
          }
          updateData['children'] = children
          break;
        case 'PARENT':
        case 'TEACHER':
          let parents = curUser.parents
          if (parents && parents.length > 0) {
            let isExisted = false
            for (let i in parents) {
              if (parents[i].openid == curUser.openId) {
                isExisted = true
                Object.assign(parents[i], curRelationship)
                break;
              }
            }
            if (!isExisted) {
              parents.push(curRelationship)
            }
          } else {
            parents = [curRelationship.userRole]
          }
          updateData['parents'] = parents
          break;
        default:
      }
      debugLog('updateData', updateData)
      // else update the user info with login time
      userApi.updateUser(curUser._id,
        updateData,
        result => {
          // debugLog('updateResult', result)
          globalData.userInfo = curUser
          wx.setStorageSync('userInfo', curUser)
          utils.runCallback(callback)(curUser)
      })
    }
  })  
}

module.exports = {
  /** common */
  initPage: initPage,
  initCreator: initCreator,

  /** Creator */
  whenIsShown: whenIsShown,
  updateRelationship: updateRelationship,

}