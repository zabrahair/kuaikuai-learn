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
    gConst: gConst,
    statistics: [
    ],
    lastDate: utils.formatDate(new Date(), '/'),
    ebbingStats: [],
    TABS_MAP: TABLES.MAP
  },
  lifetimes: {
    attached: function () {
      let that = this
      that.refreshStatistic(that);
    },
    show: function () {
      debugLog('lifetimes.show')
    }
  },
  pageLifetimes: {
    show: function () {
      // debugLog('pageLifetimes.show')
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
      if (isShown == true) {
        that.refreshStatistic(that)
        that.loadEbbingStatistics(that)
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
    },

    /**
     * 获得艾宾浩斯遗忘统计
     */
    loadEbbingStatistics: function(that){
      utils.refreshConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_CLASSES)
      let ebbingClasses = utils.getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_CLASSES)
      let ebbingStats = that.data.ebbingStats
      for (let ebbingIdx in ebbingClasses) {
        let ebbingClass = ebbingClasses[ebbingIdx]
        // debugLog('ebbingClasses', ebbingClasses)
        learnHistoryApi.ebbinghauseCount({
          question: {
            tags: gConst.ANSWER_TYPES.MANUAL_CHECK
          },
        }
          , ebbingClass
          , 0
          , countList => {
            // debugLog('ebbinghauseCount.countList', countList)
            ebbingStats[ebbingIdx] = {
              class: ebbingClasses[ebbingIdx],
              list: countList,
            }
            that.setData({
              ebbingStats: ebbingStats
            })
            // debugLog('loadEbbingStatistics', ebbingStats)
          })
      }    
    },

    onTapEbbingCard: function(e){
      let that = this
      let dataset = utils.getEventDataset(e)
      let url = '/pages/gamesRoom/words/words?gameMode=' + gConst.GAME_MODE.EBBINGHAUSE 
        + '&tableValue=' + dataset.tableValue 
        + '&tableName=' + TABLES.MAP[dataset.tableValue] 
        + '&filterTags=' + dataset.ebbingClassName 
        + "&ebbingClassName=" + dataset.ebbingClassName;
      wx.navigateTo({
        url: url,
      })
    }
  }
})
