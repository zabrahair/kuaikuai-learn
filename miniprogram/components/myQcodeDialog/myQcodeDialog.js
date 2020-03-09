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
    word: {
      type: String,
      value: '',
    },
    char: {
      type: String,
      value: null,
    },
    dictMode: {
      type: String,
      value: gConst.DICT_SEARCH_MODE.WORD,
    },
  }),

  /**
   * 组件的初始数据
   */
  data: dialogCommon.defaultDialogData({
    meaning: '',
  }),
  
  observers: {lifetimes: {
    attached: function () {
      let that = this
      dialogCommon.initDialog(that)
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
    'isShown': function (isShown) {
      let that = this
      debugLog('observers.isShown', isShown)
      if (isShown == true) {
        dialogCommon.whenIsShown(that)
        that.getMyQcode(that)

      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取单词/字解释
     */
    getMyQcode(that) {
      let userInfo = utils.getUserInfo(globalData)
      // debugLog('userInfo', userInfo)
      utils.onLoading('二维码生成中')
      wx.cloud.callFunction({
        name: 'GetMyQcode',
        data: {
          openid: userInfo._openid,
          userRole: userInfo.userRole,
          nickName: userInfo.nickName,
        },
        success: res => {
          // debugLog('getMyQcode.res', res)
          let myQcodeImage = "data:image/png;base64," + wx.arrayBufferToBase64(res.result.buffer)
          // debugLog('myQcodeImage', myQcodeImage)
          that.setData({
            myQcodeImage: myQcodeImage
          })
        },
        fail: error=>{

        },
        complete: ()=>{
          utils.stopLoading()
        }
      })
    },
    /**
     * 关闭对话框
     */
    onClose: dialogCommon.onClose,
  }
})
