const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const media = require('../../utils/media.js');
const TABLES = require('../../const/collections.js')
const animation = require('../../utils/animation.js');
const dialogCommon = require('../../common/dialog.js')

/* DB API */
const dbApi = require('../../api/db.js')
// const userApi = require('../../api/user.js')
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
      let that = this
      taskCommon.initEditor(that)
    }
  },

  pageLifetimes: {
    show: function () {
      // debugLog('getPoint.pageLifetimes.show')
      let that = this

    }
  },

  observers: {
    'isShown, curTask': function (isShown) {
      let that = this
      dialogCommon.whenIsShown(that, ()=>{
          // debugLog('observers.isShown', isShown)
          // debugLog('curTask', that.data.curTask)
          // debugLog('TASK_STATUS_OBJ', that.data.TASK_STATUS_OBJ)
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
      let curTask = that.data.curTask
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
      let curTask = that.data.curTask
      curTask.deadline.time = timeStr
      // debugLog('selectBonus.value', value)
      that.setData({
        curTask: curTask,
      })
    },

    onTapTaskActions: function(e){
      let that = this
      let dataset = utils.getEventDataset(e)
      debugLog('dataset', dataset)
      let toUpdateStatus = dataset.toUpdateStatus
      let TASK_STATUS_OBJ = that.data.TASK_STATUS_OBJ
      let processFunc = null
      let isDone = false
      switch (toUpdateStatus.value){
        case 'ASSIGNED':
          processFunc = taskCommon.createTask
          break;
        case 'CLAIMED':
          processFunc = taskCommon.claimTask
          break;
        case 'FINISHED':
          isDone = true
          wx.showModal({
            title: MSG.CONFIRM_UPDATE_TITLE,
            content: MSG.CONFIRM_UPDATE_MSG,
            success(res) {
              if (res.confirm) {
                utils.onLoading(MSG.PROCESSING)
                processFunc = taskCommon.finishTask
                media.whenAllUploaded(that.data.finishImages
                  , (filesPath) => {
                    let curTask = that.data.curTask
                    
                    curTask['finishImages'] = filesPath
                    that.setData({
                      curTask: curTask
                    }, () => {
                      debugLog('finishImages', that.data.curTask.finishImages)
                      processFunc(that, result => {
                        wx.showToast({
                          title: that.data.curTask.status.message,
                          duration: gConst.TOAST_DURATION_TIME
                        })
                        setTimeout(() => {
                          that.triggerEvent('refresh', { upTask: result.task })
                          dialogCommon.onClose(null, that)
                          utils.stopLoading()
                        }, gConst.TOAST_DURATION_TIME / 2)
                        return;
                      })
                    })
                  }) 
              } else if (res.cancel) {
                errorLog('用户点击取消')
              }
            }
          })         
          break;
        case 'APPROVED':
          processFunc = taskCommon.approveTask
          break;
        case 'CANCELED':
          processFunc = taskCommon.cancelTask
          break;
        case 'DELETED':
          processFunc = taskCommon.deleteTask
          break;
        case 'REJECTED':
          processFunc = taskCommon.rejectTask
          break;
        default:
      }
      if(isDone){
        return;
      }
      wx.showModal({
        title: MSG.CONFIRM_UPDATE_TITLE,
        content: MSG.CONFIRM_UPDATE_MSG,
        success(res) {
          if (res.confirm) {
            processFunc(that, result => {
              wx.showToast({
                title: that.data.curTask.status.message,
                duration: gConst.TOAST_DURATION_TIME
              })
              setTimeout(() => {
                that.triggerEvent('refresh', { upTask: result.task })
                dialogCommon.onClose(null, that)
              }, gConst.TOAST_DURATION_TIME / 2)
            })
          } else if (res.cancel) {
            errorLog('用户点击取消')
          }
        }
      })
    },

    /**
     * 添加任务完成证据的图片
     */
    addFinishImage: function(e){
      let that = this
      media.takeOrChooseImage(that, (pThat, filesPath)=>{
        media.makeFilesCloudPath(filesPath, [
          'users',
          that.data.userInfo.openId,
          'tasks',
          that.data.curTask._id,
          'finish',
          'images',])
        that.setData({
          finishImages: that.data.finishImages.concat(filesPath)
        },()=>{
            debugLog('addFinishImage.finishImages', that.data.finishImages)
        })
      })
    }
  }
})
