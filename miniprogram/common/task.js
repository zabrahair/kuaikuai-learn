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
const USER_ROLE_OBJS = wx.getStorageSync(gConst.USER_ROLES_OBJS_KEY)
const USER_ROLES = wx.getStorageSync(gConst.USER_ROLES_KEY)
// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

function defaultEditorData(selfData){
  let defaultData = {
    // 基本字段
    gConst: gConst,
    children: [],
    parent: [],
    userRole: null,
    userInfo: null,
    
    // 控件相关字段
    selChildrenIdx: 0,
    selBonusIdx: 0,
    deadlineDate: new Date().toLocaleDateString(),
    deadlineTime: new Date().toLocaleTimeString(),
    
    // 提交业务内容相关字段


  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

function initPage(that){
  // debugLog('getPoint.lifetimes.attached', this.properties)
  // TASK STATUS
  let TASK_STATUS = utils.getConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  let TASK_STATUS_OBJ = utils.array2Object(TASK_STATUS, 'value');
  // debugLog('TASK_STATUS', TASK_STATUS)
  // BONUS CLASSES
  let BONUS_CLASSES = utils.getConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
  let BONUS_CLASSES_OBJ = utils.array2Object(BONUS_CLASSES, 'value');
  // userInfo
  let userInfo = utils.getUserInfo(globalData)
  // userRole
  let userRole = userInfo.userRole
  that.setData({
    userInfo: userInfo,
    userRole: userRole,
    USER_ROLES: USER_ROLES,
    TASK_STATUS_OBJ: TASK_STATUS_OBJ,
    TASK_STATUS: TASK_STATUS,
    BONUS_CLASSES: BONUS_CLASSES,
    BONUS_CLASSES_OBJ: BONUS_CLASSES_OBJ,
  })
  if (userRole == USER_ROLES.PARENT) {
    // children
    userApi.getChildren(res => {
      // debugLog('getChildren', res)
      if (res) {
        that.setData({
          openid: res._id,
          children: res.children,
        })
      }
    })

  } else if (userRole == USER_ROLES.STUDENT) {
    // parents
    let res = userApi.getParents(result => {

    })
    // debugLog('getParents', res)
    if (res) {
      that.setData({
        openid: res._id,
        parents: res.parents,
      })
    }
  } 
}

function initEditor(that){
  initPage(that)
}

function getTaskTemplate(){
  let curTask = {
      fromWho: {
        openid: 'AAAA',
        name: '王祖权',
      },
      toWho: {
        openid: 'BBB',
        name: '悠悠',
      },
      content: 'ABCD',
      bonus: {
        name: '司令',
        value: 50,
      },
      deadline: {
        date: '2020/02/20',
        time: '00:12'
      },

      createTime: '',
      createTimeStr: '',
      saveTime: '',
      saveTimeStr: '',
      assignTime: '',
      assignTimeStr: '',
      receiveTime: '',
      receiveTimeStr: '',
      claimTime: '',
      claimTimeStr: '',
      implementTime: '',
      implementTimeStr: '',
      finishTime: '',
      finishTimeStr: '',
      approveTime: '',
      approveTimeStr: '',
      cancelTime: '',
      cancelTimeStr: '',
    }
  return curTask
}

function defaultListData(selfData) {
  let defaultData = {
    isShownTaskEditor: true,
    curTask: getTaskTemplate(),
  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

function initList(that) {
  utils.refreshConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  utils.refreshConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
  initPage(that)
}

module.exports = {
  /** common */
  initPage: initPage,
  
  /** Editor */
  defaultEditorData: defaultEditorData,
  initEditor: initEditor,

  /** List */
  defaultListData: defaultListData,
  initList: initList,
}