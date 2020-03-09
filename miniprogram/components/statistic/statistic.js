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
    ebbingStatsInTime: [],
    ebbingStatsTimeout: [],
    TABS_MAP: TABLES.MAP
  },
  lifetimes: {
    attached: function () {
      let that = this
      // that.refreshStatistic(that);
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
      let lastDate = utils.getDateFromStr(that.data.lastDate)
      let isCount = true
      learnHistoryApi.answerTypeStatsitic(
        {
          answerTime: _.gte(lastDate.getTime())
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
      // debugLog('run loadEbbingStatistics')
      utils.refreshConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
      let ebbingRates = utils.getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
      let ebbingStatsInTime = []
      let ebbingStatsTimeout = []

      for (let ebbingIdx = 0; ebbingIdx < (ebbingRates.length - 1); ebbingIdx++) {
        let ebbingRate = ebbingRates[ebbingIdx]
        // debugLog('ebbingRates', ebbingRates)
        // 复习正当时时间统计
        learnHistoryApi.countEbbinghaus({
          question: {
            tags: _.or([
                gConst.ANSWER_TYPES.MANUAL_CHECK,
                gConst.ANSWER_TYPES.RICITE_ARTICLE,
              ])
          },
        }
        , ebbingRate
        , 0
        , countList => {
            // debugLog('ebbinghausCount.countList', countList)
          let nextRate = utils.nextEbbingRate(ebbingRates[ebbingIdx])
          ebbingStatsInTime.push({
            rate: nextRate,
            list: countList,
            mode: learnHistoryApi.EBBING_STAT_MODE.IN_TIME,
          })
          that.setData({
            ebbingStatsInTime: ebbingStatsInTime
          })
            // debugLog('loadEbbingStatistics', ebbingStats)
        }
        , learnHistoryApi.EBBING_STAT_MODE.IN_TIME)

        // 复习超时时间统计
        learnHistoryApi.countEbbinghaus({
          question: {
            tags: _.or([
              gConst.ANSWER_TYPES.MANUAL_CHECK,
              gConst.ANSWER_TYPES.RICITE_ARTICLE,
            ])
          },
        }
          , ebbingRate
          , 0
          , countList => {
            // debugLog('ebbinghausCount.countList', countList)
            let nextRate = utils.nextEbbingRate(ebbingRates[ebbingIdx])
            ebbingStatsTimeout.push({
              rate: nextRate,
              list: countList,
              mode: learnHistoryApi.EBBING_STAT_MODE.TIMEOUT,
            })
            that.setData({
              ebbingStatsTimeout: ebbingStatsTimeout
            })
            // debugLog('ebbingStatsTimeout', that.data.ebbingStatsTimeout)
          }
          , learnHistoryApi.EBBING_STAT_MODE.TIMEOUT)
      }
    },

    onTapEbbingCard: function(e){
      let that = this
      let dataset = utils.getEventDataset(e)
      // debugLog('dataset', dataset)
      let url = ''
      if(dataset.tableValue == TABLES.CHINESE_ARTICLE){
        url = '/pages/gamesRoom/article/article?'
      }else{
        url = '/pages/gamesRoom/selfRecite/selfRecite?'
      }
      let prevEbbingRate = utils.prevEbbingRate(dataset.ebbingRate)
      url = url
        + 'gameMode=' + gConst.GAME_MODE.EBBINGHAUS
        + '&tableValue=' + dataset.tableValue
        + '&tableName=' + TABLES.MAP[dataset.tableValue].name
        + '&filterTags=' + dataset.ebbingRate.name
        + "&ebbingRateName=" + prevEbbingRate.name
        + "&ebbingStatMode=" + dataset.ebbingStatMode;
      wx.navigateTo({
        url: url,
      })
    },

    /**
     * 当点选题目类型卡
     */
    onTapAnswerTypeCard: function(e){
      let that = this
      let dataset = utils.getEventDataset(e)
      let answerType = dataset.answerType
      wx.navigateTo({
        url: '/pages/lastQuestions/lastQuestions?answerType=' + answerType + '&fromDate=' + that.data.lastDate.replace(/\//gi, '-'),
      })
    }
  }
})
