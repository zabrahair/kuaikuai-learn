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
const statCommon = require('../../common/statistic.js')


Page({

  /**
   * 页面的初始数据
   */
  data: statCommon.defaultListData({

  }),

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    statCommon.initList(that)
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
    let that = this
    utils.onLoading()
    statCommon.refreshList(that, true)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * Scroll View touch bottom
   */
  onScrollTouchBottom: function (e) {
    let that = this
    utils.onLoading()
    statCommon.refreshList(that, false)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    debugLog('click share')
  },

  /**
   * 当关闭详情对话框
   */
  refreshList: function (e) {
    let that = this
    // 从对话框传回的值
    let detail = utils.getEventDetail(e)
  },

  /**
   * 过滤任务状态
   */
  onFilter: function (e) {
    let that = this
    let idx = utils.getEventDetailValue(e)
    let dataset = utils.getEventDataset(e)
    let filterType = dataset.filterType

    switch(filterType){
      case 'fromDateOn':
        break;
      case 'table':
        break;
      case 'answerType': 
        break;
      default:
    }
    that.setData({
      curTaskStatus: status
    }, () => {
      statCommon.refreshList(that, true)
    })
  },
})