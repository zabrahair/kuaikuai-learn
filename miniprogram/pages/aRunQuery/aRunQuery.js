const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    funcName: 'Query',
    table: 'chinese-words',
    where: JSON.stringify({

    },null,4),
    update: JSON.stringify({

    }, null, 4),
    result: '',
    // Chinese Meaning
    isShownChineseMeaning: true,
    // word: '同舟共济',
    word: '商量',
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

  submitAnswer: function(e){
    // debugLog('submitAnswer.e',e)
    let form = utils.getEventDetailValue(e)
    debugLog('submitAnswer.form', form)
    let where = JSON.parse(form.where)
    let update = JSON.parse(form.update)
    debugLog('submitAnswer.form.functionName', form.functionName)
    debugLog('submitAnswer.where', where)
    debugLog('submitAnswer.update', update)
    wx.cloud.callFunction({
      name: form.functionName,
      data: {
        // table: form.tableName,
        // where: where,
        // update: update,
        // pageIdx: 0
      },
      success: res => {
        debugLog(form.functionName+'.res', res)
      },
      fail: err => {
        console.error('[云函数] ['+form.functionName+'] 调用失败', err)
      }
    })
  },
  resetAnswer: function(e){
    
  },

  /**
   * 关闭显示得分层
   */
  closeChineseMeaning: function(params) {
    let that = this
    that.setData({
      isShownChineseMeaning: false
    })
  }

})