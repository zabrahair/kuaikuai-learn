const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    curScore: {
      type: Number,
      value: -1
    },
    curDeciTimerStr: {
      type: String,
      value: -1
    },
    totalScore: {
      type: Number,
      value: -1
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    gConst: gConst,
  },

  observers: {
    // "curScore": function (curScore){
    //   let that = this
    //   that.setData({
    //     curScore: curScore.toFixed(1)
    //   })
    // },
    // "totalScore": function (totalScore) {
    //   let that = this
    //   that.setData({
    //     totalScore: totalScore.toFixed(1)
    //   })
    // }
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})
