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
const learnHistoryApi = require('../../api/learnHistory.js')

// db
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
  data: {
    statistics: [
    ],
    lastDate: utils.formatDate(new Date(), '/')
  },
  lifetimes: {
    attached: function () {
      // debugLog('getPoint.lifetimes.attached', this.properties)
      let that = this
      that.refreshStatistic(that);
    },

    show: function () {
      // debugLog('getPoint.lifetimes.show')
      let that = this
      
    },
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
      if (isShown == true) {
        that.refreshStatistic(that)
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
     * 获得整理出来的统计结果
     */
    refreshStatistic: function(that){
      // debugLog('refreshStatistic')
      learnHistoryApi.answerTypeStatsitic(
        {
          answerTimeStr: _.gte(that.data.lastDate)
        },
        0,res=>{
        // debugLog('refreshStatistic.res', res)
        that.setData({
          statistics: res
        })
      })
    },
    /**
     * 当选择日期时候
     */
    bindLastDateChange: function(e){
      let that = this
      let lastDate = utils.getEventDetailValue(e)
      lastDate = lastDate.replace(/-/gi,'/')
      // debugLog('lastDate', lastDate)
      that.setData({
        lastDate: lastDate
      }, res=>{
        that.refreshStatistic(that)
      })
    }
  }
})
