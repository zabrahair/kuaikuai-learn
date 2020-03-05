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
const FILTER_ALL = { name: "所有任务", value: "ALL", orderIdx: 0}
const TASK_DIRECT = [
  { name: '我的任务', value: 'toWho', orderIdx: 0 }
  , { name: '我委派的任务', value: 'fromWho', orderIdx: 1 }
]

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

function defaultEditorData(selfData){
  let defaultData = {
    // 基本字段
    gConst: gConst,
    children: [],
    parents: [],
    assignees: [],
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

/**
 * 初始化页面
 */
function initPage(that, callback){
  // fetch configs
  utils.refreshConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  utils.refreshConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
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
    openid: userInfo._openid,
    userInfo: userInfo,
    userRole: userRole,
    USER_ROLES: USER_ROLES,
    TASK_STATUS_OBJ: TASK_STATUS_OBJ,
    TASK_STATUS: TASK_STATUS,
    BONUS_CLASSES: BONUS_CLASSES,
    BONUS_CLASSES_OBJ: BONUS_CLASSES_OBJ,
    curTaskStatus: FILTER_ALL,
    assignees:[]
  }
  ,()=>{
    // children
    userApi.getChildren(res => {
      debugLog('getChildren', res)
      if (res.children) {
        that.setData({
          assignees: that.data.assignees.concat(res.children),
          children: res.children,
        }
        ,()=>{
          // debugLog('getChildren.assignees', that.data.assignees)
        })
      }
    })

    // parents
    userApi.getParents(res => {
      if (res.parents) {
        // debugLog('getParents', res)
        that.setData({
          assignees: that.data.assignees.concat(res.parents),
          parents: res.parents
        }, () => {
          // debugLog('getParents.assignees', that.data.assignees)
          // debugLog('getParents.parents', that.data.parents)
        })
      }
    })

    // 设置完成后回调
    utils.runCallback(callback)()
  })
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
        openid: null,
        name: null,
      },
      toWho: {
        openid: null,
        name: null,
      },
      content: null,
      bonus:  {name: '新兵', value: 1},
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
    filterTaskStatus: [FILTER_ALL],
    isShownTaskEditor: false,
    curTask: curTask,
    tasks: [],
    pageIdx: 0,
  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

function initList(that) {
  initPage(that, ()=>{
    that.setData({
      TASK_DIRECT: TASK_DIRECT,
      filterTaskStatus: that.data.filterTaskStatus.concat(TASK_STATUS),
      curTaskDirect: TASK_DIRECT[0],
    })
    // 刷新给我的任务列表
    refreshTasks(that, true)
  })


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
  let curTask = that.data.curTask
  // debugLog('whenIsShown.curTask-1', curTask)
  let userInfo = that.data.userInfo
  try{
    switch (curTask.status.value) {
      case TASK_STATUS_OBJ.CREATE.value:
        // debugLog('In CASE', TASK_STATUS_OBJ.CREATE.value)
        // let curTask = getTaskTemplate()
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
        let assignees = that.data.assignees
        if (assignees && assignees.length>0){
          curTask.toWho = {
            name: assignees[0].name,
            openid: assignees[0].openid,
          }
        }
        debugLog('whenIsShown.curTask-2', curTask)
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
function refreshMyTasks(that, isReset){
  let openid = that.data.userInfo._openid
  let pageIdx = that.data.pageIdx
  let taskDirect = that.data.curTaskDirect.value
  let where = {
    isRemoved: _.or([_.exists(false), false]),
    [taskDirect] : {
      openid: openid,
    },
  }

  if (that.data.curTaskStatus.value != FILTER_ALL.value){
    Object.assign(where
      , {
        status: {
          value: that.data.curTaskStatus.value
        }
      }
    )
  }

  debugLog('where', where)
  taskApi.query(where, pageIdx, tasks=>{
    // debugLog('refreshMyTasks.pageIdx', pageIdx)
    // debugLog('refreshMyTasks.tasks', tasks)
    if(tasks.length > 0){
      if (!isReset){
        tasks = that.data.tasks.concat(tasks)
      }
      that.setData({
        tasks: tasks,
        pageIdx: pageIdx + 1
      },()=>{
        utils.stopLoading();
      })
    }else{
      that.setData({
        tasks: [],
        pageIdx: 0
      }, () => {
        utils.stopLoading();
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
  debugLog('claimTask', task)
  taskApi.cloudWhereUpdate({_id: task._id}
  , task
  , res => {
    debugLog('claimedTask', res)
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
  debugLog('finish Task', task)
  taskApi.cloudWhereUpdate({_id: task._id }
    , task
    , res => {
      debugLog('created Task', res)
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
 * 复核任务
 */
function cancelTask(that, callback) {
  let task = Object.assign({}, that.data.curTask)
  let now = new Date()
  task.cancelTime = now.getTime();
  task.cancelTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.CANCELED.name,
    value: TASK_STATUS_OBJ.CANCELED.value,
  }
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('cancelTask', res)
      utils.runCallback(callback)(res)
    })
}


/**
 * 刷新页面，在刷新中可切换
 */
function refreshTasks(that, isReset){
  // 判断是否从头刷新
  let pageIdx = that.data.pageIdx
  if(isReset){
    pageIdx = 0
  }else{
  }
  that.setData({
    pageIdx: pageIdx
  }, ()=>{
    refreshMyTasks(that, isReset)
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
  cancelTask: cancelTask,
  whenIsShown: whenIsShown,


  /** List */
  defaultListData: defaultListData,
  initList: initList,
  showTaskEditor: showTaskEditor,
  refreshMyTasks: refreshMyTasks,
  refreshTasks: refreshTasks,
}