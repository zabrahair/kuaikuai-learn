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
const userApi = require('../../api/user.js')
const learnHistoryApi = require('../../api/learnHistory.js')
const favoritesApi = require('../../api/favorites.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    authLogin: '请授权',
    totalScore: 0,
    scoreIcon: gConst.SCORE_ICON,
    gConst: gConst,
    globalData: globalData,
    isRefreshStatistic: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    let that = this
    // debugLog('onShow', true)
    that.setData({
      authLogin: '请授权',
      totalScore: 0,
    })
    that.login();
    // 获得卡片需要的Badge上标。做过的题目数
    learnHistoryApi.getHistoryCount({
      answerTimeStr: utils.formatDate(new Date())
    }, count => {
      that.setData({
        doneCount: count
      })
    })
    // 错过的题目总数
    learnHistoryApi.getHistoryCount({
      isCorrect: false,
      // answerTimeStr: utils.formatDate(new Date())
    }, count=>{
      that.setData({
        incorrectCount: count
      })
    })
    // 收藏过的题目数量
    favoritesApi.getFavoritesCount({
    }, count => {
      that.setData({
        favoritesCount: count
      })
    })
    // 生成题型卡片
    let answerTypes = wx.getStorageSync(gConst.CONFIG_TAGS.ANSWER_TYPE)
    that.setData({
      answerTypes: answerTypes
    })
    that.setData({
      isRefreshStatistic: false,
    },()=>{
      that.setData({
        isRefreshStatistic: true,
      })
    })
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
   * 点击各种题型
   */
  onClickAnswerType: function(e){
    let that = this
    let dataset = utils.getEventDataset(e)
    let answerType = dataset.answerType
    let url = '/pages/TagsRoom/TagsRoom?answerType=' + answerType + '&gameMode =' + gConst.GAME_MODE.NORMAL

    switch (answerType){
      case gConst.ANSWER_TYPES.RICITE_ARTICLE: 
        url += '&tableValue=' + TABLES.MAP['chinese-article'].value + '&tableName=' + TABLES.MAP['chinese-article'].name
        break;
      case gConst.ANSWER_TYPES.FILL_BLANK: 
        url += '&tableValue=' + TABLES.MAP['math-divide'].value + '&tableName=' + TABLES.MAP['math-divide'].name
        break;
      case gConst.ANSWER_TYPES.OPTIONS_SELECT:
        url += '&tableValue=' + TABLES.MAP['chinese-knowledge'].value + '&tableName=' + TABLES.MAP['chinese-knowledge'].name
        break;
      case gConst.ANSWER_TYPES.SELF_RECITE:
        url += '&tableValue=' + TABLES.MAP['english-words'].value + '&tableName=' + TABLES.MAP['english-words'].name
        break;
      case gConst.ANSWER_TYPES.MANUAL_CHECK:
        url += '&tableValue=' + TABLES.MAP['chinese-words'].value + '&tableName=' + TABLES.MAP['chinese-words'].name
        break;
      case gConst.ANSWER_TYPES.SPELLING:
        url += '&tableValue=' + TABLES.MAP['english-words'].value + '&tableName=' + TABLES.MAP['english-words'].name
        break;
      default:
    }

    wx.navigateTo({
      url: url,
    })
  },

  /**
   * 题库
   */
  onClickTagsRoom: function(e){
    wx.navigateTo({
      url: '/pages/TagsRoom/TagsRoom?gameMode=' + gConst.GAME_MODE.NORMAL + '&answerType=自助默写',
    })
  },

  /**
   * 收藏
   */
  onClickFavorites: function (e) {
    wx.navigateTo({
      url: '/pages/favorites/favorites?gameMode=' + gConst.GAME_MODE.FAVORITES + '&answerType=自助默写',
    })
  },
  /**
   * 错题本
   */
  onClickWrongBook: function(e){
    wx.navigateTo({
      url: '/pages/historyBook/historyBook?gameMode=' + gConst.GAME_MODE.WRONG + '&answerType=自助默写',
    })
  },
  /**
   * 历史记录
   */
  onClickHistoryBook: function(e){
    wx.navigateTo({
      url: '/pages/historyBook/historyBook?gameMode=' + gConst.GAME_MODE.HISTORY + '&answerType=自助默写',
    })
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
  login: function () {
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
                      globalData.userInfo = result[0]
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
                    authLogin: ''
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

})
