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
  data: taskCommon.defaultEditorData({

  }),
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
    'isShown': function (isShown) {
      let that = this
      debugLog('children', that.data.children)
      debugLog('observers.isShown', isShown)
      if (isShown == true) {
        dialogCommon.whenIsShown(that)
      }
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
      // debugLog('selectAssingee.value', value)
      that.setData({
        selChildrenIdx: selIdx
      })
    },

    /**
     * 选择奖励
     */
    selectBonus: function(e){
      let that = this
      let selIdx = utils.getEventDetailValue(e)
      // debugLog('selectBonus.value', value)
      that.setData({
        selBonusIdx: selIdx
      })
    },

    onClickSave: function(e){

    },
    onClickCancel: function (e) {

    },    
    onClickAssign: function (e) {

    },
    onClickFinish: function (e) {

    },
    onClickApprove: function (e) {

    },
  }
})
