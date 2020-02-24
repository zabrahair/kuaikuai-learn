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

const dbApi = require('../../api/db.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: dialogCommon.defaultDialogProperties({

  }),

  /**
   * 组件的初始数据
   */
  data: dialogCommon.defaultDialogData({

  }),
  observers: {
    'isShown': function (isShown) {
      let that = this
      // debugLog('observers.isShown', isShown)
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
  }
})
