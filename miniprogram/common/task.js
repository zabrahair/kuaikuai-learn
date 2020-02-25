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
const taskApi = require('../api/task.js')
const learnHistoryApi = require('../api/learnHistory.js')
const configsApi = require('../api/configs.js')
const USER_ROLE_OBJS = wx.getStorageSync(gConst.USER_ROLES_OBJS_KEY)
const USER_ROLES = wx.getStorageSync(gConst.USER_ROLES_KEY)
var TASK_STATUS
var TASK_STATUS_OBJ 
var BONUS_CLASSES
var BONUS_CLASSES_OBJ

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
    selAssigneeIdx: 0,
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
  TASK_STATUS = utils.getConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  TASK_STATUS_OBJ = utils.array2Object(TASK_STATUS, 'value');
  // debugLog('TASK_STATUS', TASK_STATUS)
  // BONUS CLASSES
  BONUS_CLASSES = utils.getConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
  BONUS_CLASSES_OBJ = utils.array2Object(BONUS_CLASSES, 'value');
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

  // children
  userApi.getChildren(res => {
    // debugLog('getChildren', res)
    if (res) {
      if (userRole == USER_ROLES.PARENT) {
        // debugLog('getChildren', res)
        that.setData({
          openid: res._id,
          assignees: res.children,
          children: res.children,
        })
      } else if (userRole == USER_ROLES.STUDENT) {
        that.setData({
          children: res.children,
        })
      } 
    }
  })

  // parents
  userApi.getParents(res => {
    if (res) {
      if (userRole == USER_ROLES.PARENT) {
        that.setData({
          parents: res.parents,
        })
      } else if (userRole == USER_ROLES.STUDENT) {
        // debugLog('getChildren', res)
        that.setData({
          openid: res._id,
          assignees: res.parents,
          parents: res.parents,
        })
      } 
    }
  })


  
  if (userRole == USER_ROLES.PARENT) {
    // children
    userApi.getChildren(res => {
      // debugLog('getChildren', res)
      if (res) {
        that.setData({
          openid: res._id,
          assignees: res.children,
          children: res.children,
        })
      }
    })
  } else if (userRole == USER_ROLES.STUDENT) {

  } 
}

function initEditor(that){
  initPage(that)
}

function getTaskTemplate(){
  let curTask = {
      status: {
        name: '',
        value: '',
      },
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
  let curTask = getTaskTemplate()
  let defaultData = {
    isShownTaskEditor: false,
    curTask: curTask,
    curStatus: {},
    tasks: [],
    pageIdx: 0,
  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

function initList(that) {
  utils.refreshConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  utils.refreshConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
  initPage(that)
  // 刷新给我的任务列表
  refreshToMeTasks(that)
}

/** 
 * 创建一个委派任务
 */
function createTask(that, callback){
  let task = Object.assign({}, that.data.curTask)
  let now = new Date()
  task.assignTime = now.getTime();
  task.assignTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.ASSIGNED.name,
    value: TASK_STATUS_OBJ.ASSIGNED.value,
  }
  // debugLog('createTask.task', task)
  taskApi.create(task, res=>{
    // debugLog('createTask', res)
    utils.runCallback(callback)(res)
  })
}

/**
 * 当对话框打开时
 */
function whenIsShown(that){
  let curStatus = that.data.curStatus
  let userInfo = that.data.userInfo
  // debugLog('whenIsShown.curStatus', curStatus)
  try{
    switch (curStatus.value) {
      case TASK_STATUS_OBJ.CREATE.value:
        // debugLog('In CASE', TASK_STATUS_OBJ.CREATE.value)
        let curTask = getTaskTemplate()
        curTask.fromWho = {
          name: userInfo.contactName,
          openid: userInfo._openid,
        }
        curTask.content = ''
        curTask.bonus = BONUS_CLASSES[0]
        let now = new Date()
        now.setHours(now.getHours()+1)
        curTask.deadline = {
          date: utils.formatDate(now),
          time: utils.formatOnlyTime(now)
        }
        let children = userInfo.children
        if(children && children.length>0){
          curTask.toWho = {
            name: children[0].name,
            openid: children[0].openid,
          }
        }
        that.setData({
          curTask: curTask
        })
        break;
      default:

    }

  }catch(err){errorLog('err', err.stack)}

}

function showTaskEditor(that){
  that.setData({
    isShownTaskEditor: true
  })
}

/**
 * 发给我的任务刷新
 */
function refreshToMeTasks(that){
  let openid = that.data.userInfo._openid
  let pageIdx = that.data.pageIdx
  taskApi.query({
    toWho: {
      openid: openid
    }
  }, pageIdx, tasks=>{
    debugLog('refreshToMeTasks.res', tasks)
    if(tasks.length > 0){
      that.setData({
        tasks: tasks,
        pageIdx: pageIdx + 1
      })
    }
  })
}

/**
 * 认领任务
 */
function claimTask(that, callback){
  let task = Object.assign({}, that.data.curTask)
  let now = new Date()
  task.claimTime = now.getTime();
  task.claimTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.CLAIMED.name,
    value: TASK_STATUS_OBJ.CLAIMED.value,
  }
  taskApi.cloudWhereUpdate({_id: task._id}
  , task
  , res => {
    // debugLog('createTask', res)
    utils.runCallback(callback)(res)
  })
}

/**
 * 完成任务
 */
function finishTask(that, callback) {
  let task = Object.assign({}, that.data.curTask)
  let now = new Date()
  task.finishTime = now.getTime();
  task.finishTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.FINISHED.name,
    value: TASK_STATUS_OBJ.FINISHED.value,
  }
  taskApi.cloudWhereUpdate({_id: task._id }
    , task
    , res => {
      // debugLog('createTask', res)
      utils.runCallback(callback)(res)
  })
}

/**
 * 复核任务
 */
function approveTask(that, callback) {
  let task = Object.assign({}, that.data.curTask)
  let now = new Date()
  task.approveTime = now.getTime();
  task.approveTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.APPROVED.name,
    value: TASK_STATUS_OBJ.APPROVED.value,
  }
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('createTask', res)
      utils.runCallback(callback)(res)
  })
}

/**
 * 刷新页面，在刷新中可切换
 */
function refreshTasks(that, isReset){
  // 判断是否从头刷新
  let pageIdx
  if(isReset){
    pageIdx = 0
  }else{
    pageIdx = pageIdx
  }
  that.setData({
    pageIdx: 0
  }, ()=>{
    refreshToMeTasks(that)
  })
}

module.exports = {
  /** common */
  initPage: initPage,
  getTaskTemplate: getTaskTemplate,

  /** Editor */
  defaultEditorData: defaultEditorData,
  initEditor: initEditor,

  /** 任务生命周期 */
  createTask: createTask,
  claimTask: claimTask,
  finishTask: finishTask,
  approveTask: approveTask,
  whenIsShown: whenIsShown,


  /** List */
  defaultListData: defaultListData,
  initList: initList,
  showTaskEditor: showTaskEditor,
  refreshToMeTasks: refreshToMeTasks,
  refreshTasks: refreshTasks,
}