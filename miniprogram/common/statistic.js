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
const userApi = require('../api/user.js')
const learnHistoryApi = require('../api/learnHistory.js')
const configsApi = require('../api/configs.js')
const dialogCommon = require('../common/dialog.js')

const USER_ROLE_OBJS = wx.getStorageSync(gConst.USER_ROLES_OBJS_KEY)
const USER_ROLES = wx.getStorageSync(gConst.USER_ROLES_KEY)
const FILTER_ALL = { name: "所有", value: "ALL", orderIdx: 0 }

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

/**
 * 初始化页面
 */
function initPage(that, callback) {
  // fetch configs
  utils.refreshConfigs(gConst.CONFIG_TAGS.ANSWER_TYPE)
  // ANSWER_TYPE
  let ANSWER_TYPE = utils.getConfigs(gConst.CONFIG_TAGS.ANSWER_TYPE)
  let ANSWER_TYPE_OBJ = utils.array2Object(ANSWER_TYPE, 'value');
  // userInfo
  let userInfo = utils.getUserInfo(globalData)
  // userRole
  let userRole = userInfo.userRole
  that.setData({
    openid: userInfo._openid,
    userInfo: userInfo,
    userRole: userRole,
    USER_ROLES: USER_ROLES,
    ANSWER_TYPE: ANSWER_TYPE,
    ANSWER_TYPE_OBJ: ANSWER_TYPE_OBJ,
  }
  , () => {
      // 设置完成后回调
      utils.runCallback(callback)()
    })
}

/**
 * 初始化列表
 */
function initList(that) {
  initPage(that, () => {
    that.setData({
      // 下拉列表
      filtersAnswerType: [FILTER_ALL].concat(that.data.ANSWER_TYPE),
      filtersTable: [FILTER_ALL].concat(TABLES.LIST),
      // 当先选项
      today: utils.formatDate(new Date()),
      curFilterFromDate: utils.formatDate(new Date()),
      curFilterTable: FILTER_ALL,
      curFilterAnswerType: FILTER_ALL,
    })
    // 刷新给我的任务列表
    refreshList(that, true)
  })
}

/**
 * 列表页面默认的数据设置
 */
function defaultListData(selfData) {
  let curQuesrtion = null
  let defaultData = {
    filterTaskStatus: [FILTER_ALL],
    isShownQuestDetailStat: false,
    curQuesrtion: curQuesrtion,
    questions: [],
    pageIdx: 0,
  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

/**
 * 刷新页面，在刷新中可切换
 */
function refreshList(that, isReset) {
  // 判断是否从头刷新
  let pageIdx = that.data.pageIdx
  if (isReset) {
    pageIdx = 0
  } else {
  }
  that.setData({
    pageIdx: pageIdx
  }, () => {

  })
}


module.exports = {
  /** common */
  initPage: initPage,
  /** List */
  defaultListData: defaultListData,
  initList: initList,
  refreshList: refreshList,
}