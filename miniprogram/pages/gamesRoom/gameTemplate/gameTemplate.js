const app = getApp()
const globalData = app.globalData

const MSG = require('../../../const/message.js')
const debugLog = require('../../../utils/log.js').debug;
const errorLog = require('../../../utils/log.js').error;
const gConst = require('../../../const/global.js');
const storeKeys = require('../../../const/global.js').storageKeys;
const utils = require('../../../utils/util.js');
const TABLES = require('../../../const/collections.js')

const USER_ROLE = require('../../../const/userRole.js')
const dbApi = require('../../../api/db.js')
const userApi = require('../../../api/user.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    questions: [],
    userInfo: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
    })
    this.getQuestions()
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
   * 提交答案
   */
  submitAnswer: function (e) {
    let that = this
    let formValues = e.detail.value
  },

  /**
   * 重置答案
   */
  resetAnswer: function (e) {
    let that = this
    let formValues = e.detail.value
  },

  /**
   * 下一题
   */
  onClickNextQuestion: function (e) {
    let that = this
    let targetValues = e.target.dataset

  },

  /**
   * 获取所有题目
   */
  getQuestions: function () {
    let that = this
    let filters = {
      tags: '九九除法'
    }
    wx.cloud.callFunction({
      name: 'mathDivideQuery',
      data: {
        filters: filters
      },
      success: res => {
        debugLog('mathDivideQuery.success.res', res)
        // debugLog('queryDish.dishes.count', res.result.data.length)
        let questions = res.result.data
        that.setData({
          questions: questions
        })
      },
      fail: err => {
        console.error('[云函数] 调用失败：', err)
      }
    })
  }
})