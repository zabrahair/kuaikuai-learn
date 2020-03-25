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
const IntervalClock = require('../../utils/clock.js').IntervalClock;

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
   * 设置定时任务
   */
  setTimerTasks: function(that){
    that.data.timer.addTask('任务剩余时间', (timerTask) => {
      let tasks = that.data.tasks
      let now = new Date()
      for (let i in tasks) {
        // 以下状态才需要倒计时
        if(tasks[i].status.value == that.data.TASK_STATUS_OBJ.ASSIGNED.value
          || tasks[i].status.value == that.data.TASK_STATUS_OBJ.RECEIVED.value
          || tasks[i].status.value == that.data.TASK_STATUS_OBJ.CLAIMED.value
          || tasks[i].status.value == that.data.TASK_STATUS_OBJ.IMPLEMENTING.value){
          let deadTime = utils.mergeDateTime(tasks[i].deadline.date, tasks[i].deadline.time)
          let leftTime = deadTime.getTime() - now.getTime()
          let leftTimeStr = utils.formatDeciTimer(leftTime, 1)
          tasks[i]['leftTime'] = leftTime
        }else{
          tasks[i]['leftTime'] = null
        }

      }
      that.setData({
        tasks: tasks
      })
    })
    that.data.timer.start()
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
    that.setData({
      timer: new IntervalClock(30000),
    },()=>{
      that.setTimerTasks(that)
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    let that = this
    that.data.timer.stop()
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
    // debugLog('when ReachBottom')
    utils.onLoading()
    taskCommon.refreshTasks(that, false)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    // debugLog('click share')
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
   * 显示任务详情
   */
  copyCurrentTask: function (e) {
    let that = this

    taskCommon.showTaskEditor(that)
  },

  /**
   * 当关闭任务对话框
   */
  refreshTasks: function(e){
    let that = this
    // 从对话框传回的值
    let detail = utils.getEventDetail(e)
    // debugLog('detail', detail)
    let upTask = detail.upTask
    
    // 如果有编辑对话框传回的数值
    // 就根据这个数值刷新当前页面
    if(upTask){
      // debugLog('upTask', upTask)
      let curTaskStatus = that.data.curTaskStatus;
      let curTaskDirect = that.data.curTaskDirect
      switch(upTask.status.value){
        case 'ASSIGNED':
          // curTaskStatus = upTask.status
          curTaskDirect = taskCommon.TASK_DIRECT_OBJ['委派他人']
          break;
        case 'CLAIMED':
          // curTaskStatus = upTask.status
          curTaskDirect = taskCommon.TASK_DIRECT_OBJ['我的任务']
          break;
        case 'FINISHED':
          // curTaskStatus = upTask.status
          curTaskDirect = taskCommon.TASK_DIRECT_OBJ['我的任务']
          break;
        case 'APPROVED':
          // curTaskStatus = upTask.status
          curTaskDirect = taskCommon.TASK_DIRECT_OBJ['委派他人']
          break;
        case 'CANCELED':
          // curTaskStatus = upTask.status
          curTaskDirect = taskCommon.TASK_DIRECT_OBJ['委派他人']
          break;
        case 'DELETED':
          break;
        case 'REJECTED':
          // curTaskStatus = upTask.status
          curTaskDirect = taskCommon.TASK_DIRECT_OBJ['我的任务']
          break;
        default:
      }
      that.setData({
        curTaskDirect: curTaskDirect,
        curTaskStatus: curTaskStatus
      },()=>{
        taskCommon.refreshTasks(that, true)
      })
      
    }else{
      // 不是被编辑框调用的情况
      // 下刷新
      taskCommon.refreshTasks(that, true)
    }
    
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

    switch (filterType) {
      case 'FromDateOn':
        let dateStr = idx
        setDataObject['curFilterFromDate'] = dateStr
        break;
      case 'TaskDirect':
        let curTaskDirect = that.data.TASK_DIRECT[idx]
        setDataObject['curTaskDirect'] = curTaskDirect
        setDataObject['curTaskStatus'] = that.data.filterTaskStatus[0]
        break;
      case 'TaskStatus':
        let status = that.data.filterTaskStatus[idx]
        setDataObject['curTaskStatus'] = status
        break;
      default:
    }

    that.setData(setDataObject, () => {
      taskCommon.refreshTasks(that, true)
    })
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
      taskCommon.refreshTasks(that, true)
    })
  },
  /**
   * 对打勾的任务做状态切换，选中/未选中
   */
  onSelMultiTasks: function(e){
    let that = this
    let checkedTaskIds = utils.getEventDetail(e).value
    // debugLog('checkedTaskIds', checkedTaskIds)
    // 找到指定_id的任务然后切换状态
    for (let i in that.data.tasks) {
      let task = that.data.tasks[i]
      // debugLog('checkedTaskIds.includes(task._id)', checkedTaskIds.includes(task._id))
      if (checkedTaskIds.includes(task._id)==true) {
        that.data.tasks[i]['checked'] = true
      }else{
        that.data.tasks[i]['checked'] = false
      }
    }

    that.setData({
      tasks: that.data.tasks
    })
  },

  /**
   * 选择要更新成的状态
   */
  changeBatchStatus: function(e){
    let that = this
    let statusOffset = 5
    let value = parseInt(utils.getEventDetail(e).value)
    let curBatchStatus = that.data.TASK_STATUS[statusOffset+value]
    that.setData({
      curBatchStatus: curBatchStatus
    })
  },

  /**
   * 批量更新任务状态
   */
  toBatchUpdate: function(e){
    let that = this
    let wantProcess = 0
    let processedCount = 0
    wx.showModal({
      title: MSG.CONFIRM_UPDATE_TITLE,
      content: MSG.CONFIRM_UPDATE_ALL_MSG,
      success(res) {
        if (res.confirm) {
          for (let i = 0; i < that.data.tasks.length; i++) {
            let task = that.data.tasks[i]
            if (task.checked == true) {
              wantProcess++
              delete task.checked
              taskCommon.updateTaskStatus(that, e, task, false, () => { 
                processedCount++
                if (wantProcess == processedCount){
                  that.onPullDownRefresh()
                  utils.stopLoading();
                }
              })
            }
          }
        } else if (res.cancel) {
          errorLog('用户点击取消')
        }
      }
    })
  },
  
  /**
   * 清空选中的选项
   */
  onClearSelectTasks: function(e){
    let that = this
    // 找到指定_id的任务然后切换状态
    for (let i in that.data.tasks) {
      let task = that.data.tasks[i]
        that.data.tasks[i]['checked'] = false
    }

    that.setData({
      tasks: that.data.tasks
    })    
  }
})