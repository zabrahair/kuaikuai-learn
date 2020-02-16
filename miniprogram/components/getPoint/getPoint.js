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
utils.refreshConfigs(gConst.CONFIG_TAGS.COMBO_TYPE)

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShown: {
      type: Boolean,
      value: false,
    },
    combos: {
      type: Array,
      value: []
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    gConst: gConst,

  },

  lifetimes: {
    attached: function () {
      // debugLog('getPoint.lifetimes.attached', this.properties)
      let that = this
    
    },

    show: function () {
      debugLog('getPoint.lifetimes.show')
      let that = this
    }
  },

  pageLifetimes: {
    show: function () {
      debugLog('getPoint.pageLifetimes.show')
      let that = this
      let comboTypes = utils.getStorage(gConst.CONFIG_TAGS.COMBO_TYPE);
      that.setData({
        comboTypes: comboTypes
      })
    }
  },

  observers: {
    'isShown': function (isShown) {
      debugLog('getPoint.observers.isShown', isShown)
    },
    'combos': function (combos){
      debugLog('getPoint.observers.combos', combos)
    }
  },  

  /**
   * 组件的方法列表
   */
  methods: {
    onClose: function(e){
      let that = this
      that.setData({
        isShown: false
      }, res=>{
        that.triggerEvent('closePointLayer')
      })
    }
  }
})
