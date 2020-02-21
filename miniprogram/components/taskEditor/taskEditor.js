const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

/* DB API */
const dbApi = require('../../api/db.js')
const taskCommon = require('../../common/task.js')

/* DB Related */
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShown: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: taskCommon.initEditorData({

  }),
  observers: {
    'isShown': function (isShown) {
      let that = this
      debugLog('children', that.data.children)
      debugLog('observers.isShown', isShown)
      if (isShown == true) {
        

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
    onClose: function (e) {
      let that = this
      that.setData({
        isShown: false
      }, res => {
        that.triggerEvent('close')
      })
    },

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
    }
  }
})
