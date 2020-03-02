const MSG = require('./const/message.js')
const debugLog = require('./utils/log.js').debug;
const errorLog = require('./utils/log.js').error;
const gConst = require('./const/global.js');
const storeKeys = require('./const/global.js').storageKeys;
const utils = require('./utils/util.js');
const userInfoUtils = require('./utils/userInfo.js')
const TABLES = require('./const/collections.js')

const updateManager = wx.getUpdateManager()
/**
 * 小程序升级检测
 */
updateManager.onCheckForUpdate(function (res) {
  // 请求完新版本信息的回调
  // debugLog("onCheckForUpdate", res.hasUpdate)
})

updateManager.onUpdateReady(function () {
  wx.showModal({
    title: '更新提示',
    content: '新版本已经准备好，是否重启应用？',
    success: function (res) {
      if (res.confirm) {
        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
        updateManager.applyUpdate()
      }
    }
  })
})

updateManager.onUpdateFailed(function () {
  // 新版本下载失败
})

App({
  onLaunch: function () {
    let that = this
    // init Storage
    utils.initStorage();

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
      // Get Configs
      utils.refreshUserRoleConfigs(that.globalData)
      const configsApi = require('./api/configs.js')
      // 回答类型
      utils.refreshConfigs(gConst.CONFIG_TAGS.ANSWER_TYPE)
      // 系统设置
      utils.refreshConfigs(gConst.CONFIG_TAGS.SYSTEM_CONFIG)
      // 加成类型
      utils.refreshConfigs(gConst.CONFIG_TAGS.COMBO_TYPE)
      // 艾宾浩斯遗忘曲线设置
      utils.refreshConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_CLASSES)

      this.login();
      userInfoUtils.getUserConfigs(true)

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
        // debugLog('getSetting', res)
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
                name: 'login',
                data: {},
                success: res => {
                  // debugLog('login', res)
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
                    // debugLog('globalData.userInfo', globalData.userInfo)
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
    let userInfo = this.globalData.userInfo
    const userApi = require('./api/user.js')
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
            // debugLog(storeKeys.userInfo)
            // debugLog('', userInfo)
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
