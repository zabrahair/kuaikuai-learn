const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')
const animation = require('../../utils/animation.js');
const dialogCommon = require('../../common/dialog.js')

/* DB API */
const dbApi = require('../../api/db.js')
const userApi = require('../../api/user.js')
const taskCommon = require('../../common/task.js')

/* DB Related */
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

Component({
  /**
   * 组件的属性列表
   */
  properties: dialogCommon.defaultDialogProperties({
    curStatus: {
      type: Object,
      value: null,
    },
    curTask: {
      type: Object,
      value: null,
    },
  }),

  /**
   * 组件的初始数据
   */
  data: taskCommon.defaultEditorData(
        dialogCommon.defaultDialogData({

  })),
  lifetimes: {
    attached: function () {
      let that = this
      taskCommon.initEditor(that)
  
    },

    show: function () {
      // debugLog('getPoint.lifetimes.show')
      let that = this
    }
  },

  pageLifetimes: {
    show: function () {
      // debugLog('getPoint.pageLifetimes.show')
      let that = this

    }
  },

  observers: {
    'isShown, curStatus, curTask': function (isShown) {
      let that = this
      dialogCommon.whenIsShown(that, ()=>{
          debugLog('children', that.data.children)
          debugLog('observers.isShown', isShown)
          taskCommon.whenIsShown(that)
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 关闭对话框
     */
    onClose: dialogCommon.onClose,

    /**
     * 选择委托人
     */
    selectAssingee: function(e){
      let that = this
      let selIdx = utils.getEventDetailValue(e)
      let curTask = that.data.curTask
      curTask.toWho = {
        name: that.data.assignees[selIdx].name,
        openid: that.data.assignees[selIdx].openid,
      }
      // debugLog('selectAssingee.value', value)
      that.setData({
        selAssigneeIdx: selIdx,
        curTask: curTask,
      })
    },

    /**
     * 选择奖励
     */
    selectBonus: function(e){
      let that = this
      let selIdx = utils.getEventDetailValue(e)
      let curTask = that.data.curTask
      curTask.bonus = {
        name: that.data.BONUS_CLASSES[selIdx].name,
        value: that.data.BONUS_CLASSES[selIdx].value,
      }
      // debugLog('selectBonus.value', value)
      that.setData({
        curTask: curTask,
        selBonusIdx: selIdx,
      })
    },

    /**
     * 当输入任务内容的时候
     */
    bindTaskContentInputed: function(e){
      let that = this
      let content = utils.getEventDetailValue(e)
      let curTask = that.data.curTask
      curTask.content = content
      // debugLog('selectBonus.value', value)
      that.setData({
        curTask: curTask,
      })
    },

    /**
     * 输入最后任务完成日期
     */
    bindDeadlineDateChange: function(e){
      let that = this
      let dateStr = utils.getEventDetailValue(e)
      dateStr = dateStr.replace(/-/ig, '/')
      curTask.deadline.date = dateStr
      // debugLog('selectBonus.value', value)
      that.setData({
        curTask: curTask,
      })
    },

    /**
     * 输入最后任务完成时间
     */
    bindDeadlineTimeChange: function(e){
      let that = this
      let timeStr = utils.getEventDetailValue(e)
      curTask.deadline.time = timeStr
      // debugLog('selectBonus.value', value)
      that.setData({
        curTask: curTask,
      })
    },

    onClickSave: function(e){

    },
    onClickCancel: function (e) {
      let that = this
      dialogCommon.onClose(null, that)
    },    
    /**
     * 指派任务
     */
    onClickAssign: function (e) {
      let that = this
      wx.showModal({
        title: MSG.CONFIRM_UPDATE_TITLE,
        content: MSG.CONFIRM_UPDATE_MSG,
        success(res) {
          if (res.confirm) {
            taskCommon.createTask(that, res => {
              debugLog('afteronClickAssign ')
              wx.showToast({
                title: that.data.curStatus.message,
                duration: gConst.TOAST_DURATION_TIME
              })
              setTimeout(() => {
                dialogCommon.onClose(null, that)
              }, gConst.TOAST_DURATION_TIME)
            })
          } else if (res.cancel) {
            errorLog('用户点击取消')
          }
        }
      })

    },

    /**
     * 认领任务
     */
    onClickClaim: function(e){
      let that = this
      wx.showModal({
        title: MSG.CONFIRM_UPDATE_TITLE,
        content: MSG.CONFIRM_UPDATE_MSG,
        success: function (res) {
          if (res.confirm) {
            taskCommon.claimTask(that, res => {
              debugLog('onClickClaim ')
              wx.showToast({
                title: that.data.curStatus.message,
                duration: gConst.TOAST_DURATION_TIME
              })
              setTimeout(() => {
                that.triggerEvent('refresh')
                dialogCommon.onClose(null, that)
              }, gConst.TOAST_DURATION_TIME)
            })
          } else {
            return;
          }
        }
      })
    },

    /**
     * 完成任务
     */
    onClickFinish: function (e) {
      let that = this
      wx.showModal({
        title: MSG.CONFIRM_UPDATE_TITLE,
        content: MSG.CONFIRM_UPDATE_MSG,
        success: function (res) {
          if (res.confirm) {
            taskCommon.finishTask(that, res => {
              debugLog('onClickFinish ', that.data.curStatus)
              wx.showToast({
                title: MSG.IS_UPDATED,
                duration: gConst.TOAST_DURATION_TIME
              })
              setTimeout(() => {
                that.triggerEvent('refresh')
                dialogCommon.onClose(null, that)
              }, gConst.TOAST_DURATION_TIME)
            })
          } else {
            return;
          }
        }
      })
    },
    /**
     * 审核任务
     */
    onClickApprove: function (e) {
      let that = this
      wx.showModal({
        title: MSG.CONFIRM_UPDATE_TITLE,
        content: MSG.CONFIRM_UPDATE_MSG,
        success: function (res) {
          if (res.confirm) {
            taskCommon.approveTask(that, res => {
              debugLog('onClickApprove ', that.data.curStatus)
              wx.showToast({
                title: MSG.IS_UPDATED,
                duration: gConst.TOAST_DURATION_TIME
              })
              setTimeout(() => {
                that.triggerEvent('refresh')
                dialogCommon.onClose(null, that)
              }, gConst.TOAST_DURATION_TIME)
            })
          } else {
            return;
          }
        }
      })
    },
  }
})
