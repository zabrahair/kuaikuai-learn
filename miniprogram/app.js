const MSG = require('./const/message.js')
const debugLog = require('./utils/log.js').debug;
const errorLog = require('./utils/log.js').error;
const gConst = require('./const/global.js');
const storeKeys = require('./const/global.js').storageKeys;
const utils = require('./utils/util.js');
const TABLES = require('./const/collections.js')

const USER_ROLE = require('./const/userRole.js')
// const dbApi = require('./api/db.js')
// const userApi = require('./api/user.js')

App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      this.globalData = {}
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
      this.login();
      
    }
  },
  /**
 * 登陆
 */
  login: function () {
    let that = this
    let globalData = this.globalData
    let userInfo = utils.getUserInfo(this.globalData)
    const userApi = require('./api/user.js')
    wx.getSetting({
      success: res => {
        debugLog('getSetting', res)
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          // 在没有 open-type=getUserInfo 版本的兼容处理
          wx.getUserInfo({
            success: res => {
              // debugLog('getUserInfo', res)
              userInfo = res.userInfo;
              // debugLog('userInfo2', userInfo)
              globalData.userInfo = userInfo
              // debugLog('getUserInfo', globalData.userInfo)
              // 登陆当前用户
              // 调用云函数
              wx.cloud.callFunction({
                name: 'kuaiLogin',
                data: {},
                success: res => {
                  debugLog('login', res)
                  // debugLog('[云函数] [login] user openid: ', res.result.openid)
                  userInfo['openId'] = res.result.openid
                  userInfo['appId'] = res.result.appid;
                  // debugLog('userInfo3', userInfo)
                  userApi.queryUser({
                    _id: userInfo.openId
                  }, result => {
                    // debugLog('queryUser', result)
                    // debugLog('userInfo4', userInfo)
                    if (result.length > 0) {
                      // debugLog('1')
                      this.globalData.userInfo = result[0]
                      wx.setStorageSync('userInfo', result[0])
                      // debugLog('2')
                      that.setData({
                        userInfo: result[0]
                      })
                    } else {
                      globalData.userInfo = userInfo
                      wx.setStorageSync('userInfo', userInfo)
                    }
                    debugLog('globalData.userInfo', globalData.userInfo)
                    that.checkUserExisted()
                  })
                },
                fail: err => {
                  // console.error('[云函数] [login] 调用失败', err)
                }
              })
            }
          })
        }
      }
    })
  },

  /**
 * 判断用户是否存在于数据库
 */
  checkUserExisted: function () {
    let that = this
    let userInfo = globalData.userInfo
    userApi.queryUser({
      _id: userInfo.openId
    }, result => {
      // debugLog('queryUserResult', result)
      // If not found the user insert a new one.
      if (result.length <= 0) {
        wx.navigateTo({
          url: '../register/register'
        })
      } else {
        userInfo = result[0]
        // else update the user info with login time
        userApi.updateUser(result[0]._id,
          {},
          result => {
            // debugLog('updateResult', result)
            debugLog(storeKeys.userInfo)
            debugLog('', userInfo)
            globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            // wx.switchTab({
            //   url: '../menuList/menuList'
            // })
          })
      }
    })
  },
})
