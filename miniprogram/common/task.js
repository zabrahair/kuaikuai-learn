const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js')
// Api Handler
const dbApi = require('../api/db.js')
const favoritesApi = require('../api/favorites.js')
const userApi = require('../api/user.js')
const learnHistoryApi = require('../api/learnHistory.js')
const configsApi = require('../api/configs.js')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

function initEditorData(selfData){
  let defaultData = {
    children: [{
      name: "月亮代表我的家",
      openid: "oqlpK5AgEJOqgii33hRM7G5AN-bc",
    }],
    selChildrenIdx: 0,
    deadlineDate: new Date().toLocaleDateString(),
    deadlineTime: new Date().toLocaleTimeString(),
    selBonusIdx: 0,
    BonusClasses: [
      {
        name: '新兵',
        value: 1,
      },
      {
        name: '老兵',
        value: 5,
      },
      {
        name: '班长',
        value: 10,
      },
      {
        name: '排长',
        value: 20,
      },
    ]
  }
  let finalData = Object.assign(selfData, defaultData)
  return finalData
}

function initData(selfData) {
  let defaultData = {

  }
  let finalData = Object.assign(selfData, defaultData)
  return finalData
}

module.exports = {
  initData: initData,
  initEditorData: initEditorData,
}