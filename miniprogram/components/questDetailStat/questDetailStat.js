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
const statCommon = require('../../common/statistic.js')

const dbApi = require('../../api/db.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: dialogCommon.defaultDialogProperties({
    curItem: {
      type: Object,
      value: null,
    },
  }),

  /**
   * 组件的初始数据
   */
  data: dialogCommon.defaultDialogData({
    meaning: '',
  }),

  observers: {
    lifetimes: {
      attached: function () {
        let that = this
        dialogCommon.initDialog(that)
      },
      show: function () {
     //   debugLog('lifetimes.show')
      }
    },
    pageLifetimes: {
      show: function () {
        // debugLog('pageLifetimes.show')
      }
    },
    'isShown, curItem': function (isShown, curItem) {
      let that = this
      dialogCommon.whenIsShown(that, () => {
        // debugLog('observers.isShown', isShown)
        // debugLog('curItem', that.data.curItem)
        statCommon.whenIsShown(that)
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * Scroll View touch bottom
     */
    onScrollTouchBottom: function (e) {
      let that = this
      utils.onLoading()
      // debugLog('onScrollTouchBottom')
      statCommon.refreshDetailList(that, false)
    },

    /**
     * 关闭对话框
     */
    onClose: dialogCommon.onClose,
  }
})
