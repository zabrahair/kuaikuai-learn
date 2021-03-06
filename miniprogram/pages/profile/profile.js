const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

const dbApi = require('../../api/db.js')
const userApi = require('../../api/user');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    authLogin: '请授权',
    totalScore: 0,
    scoreIcon: gConst.SCORE_ICON,
    isSignIn: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    // debugLog('profile.options', options)
    that.setData(
      {options: options}
      , ()=>{
      that.login(()=>{
        that.checkForMakeRelationship(that, options)
      });
      }
    )
  },

  /**
   * 判断是否有足够的options参数，打开建立联系的对话框
   */
  checkForMakeRelationship: function(that, options){
    if(typeof options.openid == 'string'
      && typeof options.userRole == 'string'
      && typeof options.nickName == 'string'){
      that.tapProfileFeature({
        target : {
          dataset:{
            featureName: 'makeRelationship'
          }
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      authLogin: '请授权',
      totalScore: 0,
    })
    // debugLog('onShow', true)
    this.login();
  },



  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 获得用户信息
   */
  getUserInfo: function (e) {
    var that = this;
    // debugLog('auth.event', e.detail)
    let avatarUrl = e.detail.userInfo.avatarUrl
    let userInfo = e.detail.userInfo
    // debugLog('userInfo1', userInfo)
    this.login()
  },

  /**
   * 登陆
   */
  login: function (callback) {
    let that = this
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
    })
    utils.getTotalScore(userInfo, userScore => {
      that.setData({
        totalScore: userScore.score.toFixed(1),
      })
    })
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
              that.setData({
                userInfo: userInfo
              })
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
                  that.setData({
                    userInfo: userInfo
                  })
                  userApi.queryUser({
                    _id: userInfo.openId
                  }, result => {
                    // debugLog('queryUser', result)
                    // debugLog('userInfo4', userInfo)
                    if (result.length > 0) {
                      // debugLog('1')
                      app.globalData.userInfo = result[0]
                      wx.setStorageSync('userInfo', result[0])
                      // debugLog('2')
                      that.setData({
                        userInfo: result[0]
                      })
                    } else {
                      globalData.userInfo = userInfo
                      wx.setStorageSync('userInfo', userInfo)
                      that.setData({
                        userInfo: userInfo
                      })
                    }
                    // debugLog('globalData.userInfo', globalData.userInfo)
                    that.checkUserExisted()
                  })
                  that.setData({
                    authLogin: '',
                    isSignIn: true,
                  }, ()=>{
                    utils.runCallback(callback)()
                  })
                  utils.getTotalScore(userInfo, userScore => {
                    that.setData({
                      totalScore: userScore.score.toFixed(1),
                    })
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
  /**
   * 登出
   */
  toSignOut: function(e){
    let that = this
    wx.showModal({
      title: MSG.CONFIRM_TITLE,
      content: MSG.SIGNOUT_CONFIRM_MSG,
      success(res) {
        if (res.confirm) {
          // debugLog('用户点击确定')
          wx.openSetting({
            success(res) {
              console.log(res.authSetting)
              delete globalData.userInfo
              // debugLog('globalData', globalData)
              wx.clearStorage({
                complete: function(e){
                  wx.switchTab({
                    url: '/pages/index/index',
                  })
                },
              });
            }
          })
        } else if (res.cancel) {
          errorLog('用户点击取消')
        }
      }
    })
  },
  /**
   * tapProfileFeature
   */
  tapProfileFeature: function(e){
    let that = this
    let dataset = utils.getEventDataset(e)
    let featureName = dataset.featureName

    if (featureName == 'history'){
      wx.navigateTo({
        url: '/pages/history/history',
      })
    } else if (featureName == 'myQcode') {
      that.setData({
        isShownMyQcode: true
      })
    } else if (featureName == 'scanQcode') {
      that.setData({
        isShownScanQcode: true
      })
    } else if (featureName == 'myStatistic') {
      that.setData({
        isShownStatisticDialog: true
      })
    } else if (featureName == 'questions') {
      wx.navigateTo({
        url: '/pages/contentList/contentList',
      })
    } else if (featureName == 'lastQuestions') {
      wx.navigateTo({
        url: '/pages/lastQuestions/lastQuestions',
      })
    } else if (featureName == 'makeRelationship') {
      that.setData({
        isShowMakeRelationship: true
      })
    } else if (featureName == 'manageTool') {
      wx.navigateTo({
        url: '/pages/aRunQuery/aRunQuery',
      })
    }
  }

  
})