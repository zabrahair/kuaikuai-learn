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
var dataLoadTimer = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,

    // history related

    // score related
    totalScore: 0,
    dailyRecords: [],

    // icons related
    thinkIcon: gConst.THINK_ICON,
    expIcon: gConst.EXP_ICON,
    scoreIcon: gConst.SCORE_ICON,
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
    let pageIdx = 0
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
    })
    if (!userInfo.openId) {
      this.setData({
        userInfo: null,
        totalScore: 0,
        dailyRecords: [],
      })
      return;
    }
    utils.getTotalScore(userInfo, userScore => {
      that.setData({
        totalScore: userScore.score.toFixed(1),
      })
    })

    clearInterval(dataLoadTimer)
    dataLoadTimer = setInterval(function () {
      learnHistoryApi.dailyStatistic(userInfo
        , {
          openid: userInfo.openId
        }
        , pageIdx
        , res => {
          // debugLog('history.onShow.dailyStatistic[' + TABLES.LEARN_HISTORY + ']', res)
          try {
            if (res.list.length && res.list.length > 0 && pageIdx < 5) {
              let dailyRecords = that.formatDailyHistoryRecord(res.list)
              dailyRecords = that.data.dailyRecords.concat(dailyRecords)

              // debugLog('history.dailyRecords', dailyRecords)
              that.setData({
                dailyRecords: dailyRecords,
              })
            } else {
              clearInterval(dataLoadTimer)
            }
          } catch (e) {
            wx.showToast({
              image: gConst.ERROR_ICON,
              title: MSG.SOME_EXCEPTION,
              duration: 1000,
            })
          }
        })  
      pageIdx
    }, 1000)
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
   * Format History Records
   */
  formatDailyHistoryRecord: function(dailyRecords){
    let date;
    for (let idx in dailyRecords){
      dailyRecords[idx].avgThinkTime = (parseFloat(dailyRecords[idx].avgThinkTime) / 1000.0).toFixed(2)
      date = new Date(dailyRecords[idx].answerDate)
      dailyRecords[idx]['formatAnswerDate'] = date.getFullYear() + '年' + (date.getMonth()+1) + '月' + date.getDate()+ '日'
    }
    return dailyRecords
  }
})