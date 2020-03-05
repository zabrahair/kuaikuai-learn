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
const taskCommon = require('../../common/task.js')


Page({

  /**
   * 页面的初始数据
   */
  data: taskCommon.defaultListData({
    
  }),

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    taskCommon.initList(that)
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
    taskCommon.refreshTasks(that, true)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * Scroll View touch bottom
   */
  onScrollTouchBottom: function(e){
    let that = this
    debugLog('when ReachBottom')
    utils.onLoading()
    taskCommon.refreshTasks(that, false)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    debugLog('click share')
  },

  /**
   * 调整页面式样
   */
  toCreateTask: function(e){
    let that = this
    let curTask = taskCommon.getTaskTemplate()
    curTask.status = that.data.TASK_STATUS_OBJ.CREATE
    that.setData({
      curTask: curTask
    },()=>{
      taskCommon.showTaskEditor(that)
    })
    
  },

  /**
   * 显示任务详情
   */
  showCurrentTask: function(e){
    let that = this
    let dataset = utils.getEventDataset(e)
    let curTask = dataset.task
    that.setData({
      curTask: curTask,
    },()=>{
      taskCommon.showTaskEditor(that)
    })
  },

  /**
   * 当关闭任务对话框
   */
  refreshTasks: function(e){
    let that = this
    // debugLog('refreshTasks')
    taskCommon.refreshTasks(that, true)
  },

  /**
   * 过滤任务状态
   */
  onFilterTaskStatus: function(e){
    let that = this
    let statusIdx = utils.getEventDetailValue(e)
    let status = that.data.filterTaskStatus[statusIdx]
    that.setData({
      curTaskStatus: status
    },()=>{
      taskCommon.refreshTasks(that, true)
    })
  },

  /** 
   * 过滤给我的任务还是我给的任务
   */
  onFilterTaskDirect: function(e){
    let that = this
    let taskDirectIdx = utils.getEventDetailValue(e)
    let curTaskDirect = that.data.TASK_DIRECT[taskDirectIdx]
    that.setData({
      curTaskDirect: curTaskDirect,
      curTaskStatus: that.data.filterTaskStatus[0]
    }, () => {
      taskCommon.refreshTasks(that, true)
    })
  }
})