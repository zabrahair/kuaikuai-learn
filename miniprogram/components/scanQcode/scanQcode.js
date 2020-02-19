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

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShown: {
      type: Boolean,
      value: false,
    },
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
  },

  /**
   * 组件的初始数据
   */
  data: {
    meaning: '',
  },
  observers: {
    'isShown': function (isShown) {
      let that = this
      debugLog('observers.isShown', isShown)
      if (isShown == true) {
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
      wx.cloud.callFunction({
        name: 'GetMyQcode',
        data: {
          openid: userInfo._openid,
          userRole: userInfo.userRole,
        },
        success: res => {
          // debugLog('getMyQcode.res', res)
          let myQcodeImage = "data:image/png;base64," + wx.arrayBufferToBase64(res.result.buffer)
          // debugLog('myQcodeImage', myQcodeImage)
          that.setData({
            myQcodeImage: myQcodeImage
          })
        },
        fail: error => {

        }
      })
    },
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
    }
  }
})
