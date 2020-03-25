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
    'isShown, curTask': function (isShown, curTask) {
      let that = this
      dialogCommon.whenIsShown(that, ()=>{
          // debugLog('observers.isShown', isShown)
       //   debugLog('curTask', that.data.curTask)
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
      // debugLog('selectAssingee.value', selIdx)
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
      taskCommon.updateTaskStatus(that, e, that.data.curTask, true, ()=>{})
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
        let curTask = that.data.curTask
        if (curTask.finishImages){
          curTask.finishImages = curTask.finishImages.concat(filesPath)
        }else{
          curTask['finishImages'] = filesPath
        }

        that.setData({
          curTask: curTask
        },()=>{
         //   debugLog('addFinishImage.curTask.finishImages', that.data.curTask.finishImages)
        })
      })
    },

    /**
     * 浏览已经上传的图片
     */
    onTapReviewImage: function(e){
      let that = this
      let dataset = utils.getEventDataset(e)
      // debugLog('step ', dataset)
      let curUrl = dataset.finishImage.url ? dataset.finishImage.url : dataset.finishImage.path
      let finishImagesUrl = []
      let finishImages = that.data.curTask.finishImages
      for(let i in that.data.curTask.finishImages){
        let url = finishImages[i].url ? finishImages[i].url : finishImages[i].path
        finishImagesUrl.push(url)
      }
      wx.previewImage({
        current: curUrl, // 当前显示图片的http链接
        urls: finishImagesUrl // 需要预览的图片http链接列表
      })
    },

    /**
     * 当更新留言
     */
    onRenewComment: function(e){
      let that = this
      let detail = utils.getEventDetail(e)
      let renewComment = detail.comment
      let comments = that.data.curTask.comments ? that.data.curTask.comments : []
      // debugLog('renewComment', renewComment)
      // 追加或者更新留言
      if(comments.length < 1){
        comments.unshift(renewComment)
      }else{
        let isFoundHistory = false
        for({v, k} in comments.length){
          if (v.createTime == renewComment.createTime 
          && v.author == renewComment.author){
            comments[i] = renewComment
            isFoundHistory = true
            break;
          }
        }
        if (!isFoundHistory){
          comments.unshift(renewComment)
        }
      }
      that.data.curTask.comments = comments
      // debugLog('curTask', that.data.curTask)
      that.setData({
        curTask: that.data.curTask
      })
    },
    /**
    * 当完成任务的时限改变时
    */
    onTaskPeriodChange: function (e) {
      let that = this
      try {
        // let dataset = utils.getEventDataset(e)
        // debugLog('dataset', dataset)
        
        let detail = utils.getEventDetail(e)
        // debugLog('detail', detail)
        let deadlineTimePeriod = detail.millSecs

        that.setData({
          deadlineTimePeriod: deadlineTimePeriod
        }, () => {

        })
      } catch (e) {
        errorLog('onTaskPeriodChange.e')
      }
    }
  },
})
