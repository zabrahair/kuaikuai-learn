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

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showUnits: {
      type: String,
      value: '',
    },
    prefix: {
      type: String,
      value: '',
    },
    subfix: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    period_units: utils.getTimePeriodPickerData(),
    selPeriod: utils.getTimePeriodObj(),
  },
  lifetimes: {
    attached: function () {
      let that = this
    },

    show: function () {
      let that = this
      
    }
  },

  pageLifetimes: {
    show: function () {
      // debugLog('getPoint.pageLifetimes.show')
      let that = this
      debugLog('period_units', that.data.period_units)
    }
  },
  observers: {
    'showUnits': function(showUnits){
      let that = this
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onPeriodChange: function(e){
      let that = this
      try{
        let dataset = utils.getEventDataset(e)
        let value = utils.getEventDetail(e).value
        // debugLog('dataset', dataset)
        // debugLog('value', value)
        let selPeriod = that.data.selPeriod
        selPeriod[dataset.periodName].value = value
        let totalMillSecs = utils.getMillSecsFromPeriod(selPeriod)
        that.setData({
          selPeriod: selPeriod,
          totalMillSecs: totalMillSecs
        }, () => {
          // debugLog('selPeriod', selPeriod)
          debugLog('totalMillSecs', totalMillSecs)
          that.triggerEvent('changed', { millSecs: that.data.totalMillSecs})
        })
      }catch(e){
        errorLog('onPeriodChange.e', e.stack)
      }

    }
  }
})
