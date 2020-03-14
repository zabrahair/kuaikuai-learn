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
const poemCommon = require('../../common/poem.js')
const common = require('../gamesRoom/common/common.js')

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
    that.setData({
      options: options
    }, () => {
      statCommon.initList(that)
    })

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
    poemCommon.search('鹅鹅鹅', result=>{

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
    // debugLog('onScrollTouchBottom')
    statCommon.refreshList(that, false)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    // debugLog('click share')
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
    let setDataObject = {}

    // debugLog('idx', idx)
    switch (filterType) {
      case 'fromDateOn':
        let dateStr = idx
        setDataObject['curFilterFromDate'] = dateStr
        break;
      case 'table':
        let filterTable = that.data.filtersTable[idx]
        setDataObject['curFilterTable'] = filterTable
        break;
      case 'answerType':
        let filterAnswerType = that.data.filtersAnswerType[idx]
        setDataObject['curFilterAnswerType'] = filterAnswerType
        break;
      case 'ebbinghaus':
        let filterEbbinghaus = that.data.filtersEbbinghaus[idx]
        setDataObject['curFilterEbbinghaus'] = filterEbbinghaus
        break;
      case 'answerResult':
        let filterAnswerResult = that.data.filtersAnswerResult[idx]
        setDataObject['curFilterAnswerResult'] = filterAnswerResult
        break;
      default:
    }

    // debugLog('setDataObject', setDataObject)
    that.setData(setDataObject, () => {
      statCommon.refreshList(that, true)
    })
  },

  /**
   * 显示题目详情
   */
  showCurrentQuestion: function (e) {
    let that = this
    let dataset = utils.getEventDataset(e)
    let curItem = dataset.item
    that.setData({
      curItem: curItem,
    }, () => {
      statCommon.showQuestionDetail(that)
    })
  },

  /**
   * 重新做题
   */
  showQuestion: function (e) {
    let that = this
    let dataset = utils.getEventDataset(e)
    let curItem = dataset.item
    that.setData({
      selectedTags: curItem.question.tags,
      gameMode: gConst.GAME_MODE.HISTORY,
      selectedTable: TABLES.MAP[curItem.table],
      lastDate: that.data.curFilterFromDate,
      selAnswerType: curItem.answerType,
    },
      () => {
        common.onClickEnterInTagRoom(that, e)
      })

  },
  /**
   * 刷新共有多少道题目被检索
   */
  refreshTotalCount: function (totalCount) {
    wx.setNavigationBarTitle({
      title: '共做了' + totalCount + '道题'
    })
  },

  /**
   * 切换开始日期的使用
   */
  onTapSwitchFromDate: function (e) {
    let that = this
    let ifUsingFromDate = that.data.ifUsingFromDate
    if (ifUsingFromDate) {
      ifUsingFromDate = false
    } else {
      ifUsingFromDate = true
    }
    that.setData({
      ifUsingFromDate: ifUsingFromDate
    }, () => {
      statCommon.refreshList(that, true)
    })
  },
})