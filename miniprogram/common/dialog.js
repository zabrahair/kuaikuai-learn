const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const animation = require('../utils/animation.js');
const TABLES = require('../const/collections.js')
// Api Handler
const dbApi = require('../api/db.js')
const configsApi = require('../api/configs.js')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

function defaultDialogProperties(selfProperties){
  let properties = {
    isShown: {
      type: Boolean,
      value: false,
    },
  }
  let finalProperties = Object.assign(selfProperties, properties)
  // debugLog('finalData', finalData)
  return finalProperties
}

function defaultDialogData(selfData) {
  let defaultData = {
    gConst: gConst,
    /** 动画对象 */
    switchDialogStatus: null,
  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

function initDialog(that) {

}

function getPropertiesTemplate() {
  let properties = {
    isShown: {
      type: Boolean,
      value: false,
    },
  }
  return properties
}

const onClose = function(e) {
  let that = this
  animation.playSwitchDialog(
    that,
    animation.MAP.CLOSE_DIALOG.name,
    {},
    () => {
      that.setData({
        isShown: false
      }, res => {
        that.triggerEvent('close')
      })
    })
}

function whenIsShown(that){
  animation.playSwitchDialog(
    that,
    animation.MAP.OPEN_DIALOG.name)
}

module.exports = {
  defaultDialogProperties: defaultDialogProperties,
  defaultDialogData: defaultDialogData,
  initDialog: initDialog,
  onClose: onClose,
  whenIsShown: whenIsShown,
}