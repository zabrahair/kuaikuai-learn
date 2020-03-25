const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const media = require('../utils/media.js');
const TABLES = require('../const/collections.js')
// Api Handler
const dbApi = require('../api/db.js')
const favoritesApi = require('../api/favorites.js')
const userApi = require('../api/user.js')
const taskApi = require('../api/task.js')
const learnHistoryApi = require('../api/learnHistory.js')
const configsApi = require('../api/configs.js')

const dialogCommon = require('../common/dialog.js')

var USER_ROLE_OBJS
var USER_ROLES
var TASK_STATUS
var TASK_STATUS_OBJ 
var BONUS_CLASSES
var BONUS_CLASSES_OBJ
var TASK_FINISH_STATUS
var TASK_FINISH_STATUS_OBJ

const FILTER_ALL = { name: "所有任务", value: "ALL", orderIdx: 0}
const TASK_DIRECT = [
  { key: '我的任务', name: '我的任务', value: 'toWho', orderIdx: 0 }
  , { key: '委派他人', name: '我委派的任务', value: 'fromWho', orderIdx: 1 }
]
const TASK_DIRECT_OBJ = utils.array2Object(TASK_DIRECT, 'key')

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
    // userRole: null,
    userInfo: null,
    
    // 控件相关字段
    selAssigneeIdx: 0,
    selBonusIdx: 0,
    deadlineDate: utils.formatDate(new Date()),
    deadlineTime: utils.formatOnlyTime(new Date()),
    deadlineTimeType: gConst.TIME_SELECTOR_TYPE.PERIOD,
    deadlineTimePeriod: 0,  //单位：毫秒
    
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
  // // fetch configs
  // utils.refreshConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  // utils.refreshConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
  USER_ROLE_OBJS = wx.getStorageSync(gConst.USER_ROLES_LIST_KEY)
  USER_ROLES = wx.getStorageSync(gConst.USER_ROLES_KEY)
  // TASK STATUS
  TASK_STATUS = utils.getConfigs(gConst.CONFIG_TAGS.TASK_STATUS)
  TASK_STATUS_OBJ = utils.array2Object(TASK_STATUS, 'value');
  // debugLog('TASK_STATUS', TASK_STATUS)
  // BONUS CLASSES
  BONUS_CLASSES = utils.getConfigs(gConst.CONFIG_TAGS.BONUS_CLASSES)
  BONUS_CLASSES_OBJ = utils.array2Object(BONUS_CLASSES, 'name');
  TASK_FINISH_STATUS = gConst.TASK_FINISH_STATUS
  TASK_FINISH_STATUS_OBJ = utils.array2Object(TASK_FINISH_STATUS, 'value')
  // userInfo
  let userInfo = utils.getUserInfo(globalData)
  // debugLog('userInfo', userInfo)
  // userRole
  let userRole = userInfo.userRole
  that.setData({
    gConst: gConst,
    openid: userInfo.openId,
    userInfo: userInfo,
    userRole: userRole,
    USER_ROLES: USER_ROLES,
    TASK_STATUS_OBJ: TASK_STATUS_OBJ,
    TASK_STATUS: TASK_STATUS,
    BONUS_CLASSES: BONUS_CLASSES,
    BONUS_CLASSES_OBJ: BONUS_CLASSES_OBJ,
    TASK_FINISH_STATUS: TASK_FINISH_STATUS,
    TASK_FINISH_STATUS_OBJ: TASK_FINISH_STATUS_OBJ,
    curTaskStatus: FILTER_ALL,
    assignees: [{ name: '自己', openid: userInfo.openId}]
  }
  ,()=>{
    // relationship
    userApi.getRelationships(res => {
      // debugLog('getRelationship', res)
      if (res.relationships) {
        that.setData({
          assignees: that.data.assignees.concat(res.relationships),
          children: res.relationships,
        }
          , () => {
            // debugLog('getRelationship.assignees', that.data.assignees)
          })
      }
    })

    // // children
    // userApi.getChildren(res => {
    //   // debugLog('getChildren', res)
    //   if (res.children) {
    //     that.setData({
    //       assignees: that.data.assignees.concat(res.children),
    //       children: res.children,
    //     }
    //     ,()=>{
    //       // debugLog('getChildren.assignees', that.data.assignees)
    //     })
    //   }
    // })

    // // parents
    // userApi.getParents(res => {
    //   if (res.parents) {
    //     // debugLog('getParents', res)
    //     that.setData({
    //       assignees: that.data.assignees.concat(res.parents),
    //       parents: res.parents
    //     }, () => {
    //       // debugLog('getParents.assignees', that.data.assignees)
    //       // debugLog('getParents.parents', that.data.parents)
    //     })
    //   }
    // })

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
        date: utils.formatDate(new Date()),
        time: utils.formatOnlyTime(new Date()),
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
    openid: null,
    userRole: null,
  }
  let finalData = Object.assign(selfData, defaultData)
  // debugLog('finalData', finalData)
  return finalData
}

function initList(that) {
  initPage(that, ()=>{
    that.setData({
      TASK_DIRECT: TASK_DIRECT,
      ifUsingFromDate: true,
      curFilterFromDate: utils.formatDate(new Date()),
      filterTaskStatus: that.data.filterTaskStatus.concat(TASK_STATUS),
      curTaskDirect: TASK_DIRECT[0],
      curBatchStatus: TASK_STATUS_OBJ.CLAIMED
    })
    // 刷新给我的任务列表
    refreshTasks(that, true)
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
        curTask.assignTime = now.getTime()
        curTask.assignTimeStr = utils.formatDateTime(now)
        now.setHours(now.getHours() + 1)
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
        // debugLog('whenIsShown.curTask-2', curTask)
        that.setData({
          curTask: curTask,
        })
        break;
      case TASK_STATUS_OBJ.COPY.value:
        let copyTask = taskCommon.getTaskTemplate()
        now = new Date()
        // 算出原本的period
        let assignTime = curTask.assignTime
        let deadline = utils.mergeDateTime(curTask.deadline.date, curTask.deadline.time)
        let period = deadline.getTime() - assignTime
        // 算出新的date 和 time
        deadline = new Date(now + period)
        Object.assign(copyTask, {
          fromWho: curTask.fromWho,
          toWho: curTask.toWho,
          content: curTask.content,
          bonus: curTask.bonus,
          assignTime: now.getTime(),
          assignTimeStr:utils.formatDateTime(now),
          deadline: {
            date: utils.formatDate(deadline),
            time: utils.formatOnlyTime(deadline),
            period: period,
          },
          status: that.data.TASK_STATUS_OBJ.COPY
        })
        that.setData({
          curTask: curTask,
        })
        break;
      default:
        // 创建和复制就不用转换了，因为已经转换过了
        if (curTask.status.value != TASK_STATUS_OBJ.COPY.value 
        && curTask.status.value != TASK_STATUS_OBJ.CREATE.value){
          let deadline = utils.mergeDateTime(curTask.deadline.date, curTask.deadline.time)
          period = curTask.deadline.period ? curTask.deadline.period : (deadline.getTime() - curTask.assignTime)
          Object.assign(curTask, {
            deadline: {
              date: utils.formatDate(deadline),
              time: utils.formatOnlyTime(deadline),
              period: period,
            },
          })
          that.setData({
            curTask: curTask,
          })
        }
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
  let openid = that.data.userInfo.openId
  // debugLog('openid', openid)
  if(!openid || openid.trim() == ''){
    // debugLog('No user no tasks') 
    return
  }
  let pageIdx = that.data.pageIdx
  let taskDirect = that.data.curTaskDirect.value
  // debugLog('taskDirect', taskDirect)
  // debugLog('openid', openid)
  let where = {
    isRemoved: _.or([_.exists(false), false]),
    [taskDirect] : {
      "openid": openid,
    },
  }
  // 创建时间过滤
  let lastDate = utils.getDateFromStr(that.data.curFilterFromDate)
  // debugLog('lastDate', lastDate)
  if (that.data.curFilterFromDate && that.data.ifUsingFromDate) {
    Object.assign(where, {
      assignTime: _.gte(lastDate.getTime())
    })
  }

  // debugLog('where', where)
  if (that.data.curTaskStatus.value != FILTER_ALL.value){
    Object.assign(where
      , {
        status: {
          value: that.data.curTaskStatus.value
        }
      }
    )
  }

  // debugLog('where', where)
  taskApi.query(where, pageIdx, tasks=>{
    // debugLog('refreshMyTasks.pageIdx', pageIdx)
    // debugLog('refreshMyTasks.tasks.length', tasks.length)
    if(tasks.length > 0){
      // debugLog('isReset', isReset)
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
      // 如果需要刷新记录
      if (isReset){
        that.setData({
          tasks: [],
          pageIdx: 0
        }, () => {
          utils.stopLoading();
        })  
      }else{
      // 如果不需要刷新记录
        utils.stopLoading();
      }

    }
  })
}

/** 
 * 创建一个委派任务
 */
function createTask(that, pTask, callback) {
  let task = Object.assign({}, pTask)
  let now = new Date()
  task.assignTime = now.getTime();
  task.assignTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.ASSIGNED.name,
    value: TASK_STATUS_OBJ.ASSIGNED.value,
    orderIdx: TASK_STATUS_OBJ.ASSIGNED.orderIdx,
  }

  // 如果计算时间区间
  if (that.data.deadlineTimeType ==  gConst.TIME_SELECTOR_TYPE.PERIOD){
    let deadline = new Date(task.assignTime + that.data.deadlineTimePeriod)
    task.deadline.date = utils.formatDate(deadline)
    task.deadline.time = utils.formatOnlyTime(deadline)
    task.deadline['period'] = that.data.deadlineTimePeriod
  }


  // debugLog('createTask.task', task)
  taskApi.create(task, res => {
    if(task.toWho.openid == that.data.userInfo.openId){
      //  如果是自己的任务直接认领
      task['_id'] = res._id
      that.setData({
        curTask: task
      },()=>{
        claimTask(that, task, callback)
      })
    }else{
      //  如果不是自己发给自己的任务
      utils.runCallback(callback)({ task: task, res: res })
    }
  })
}

/**
 * 认领任务
 */
function claimTask(that, pTask, callback){
  let task = Object.assign({}, pTask)
  let now = new Date()
  task.claimTime = now.getTime();
  task.claimTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.CLAIMED.name,
    value: TASK_STATUS_OBJ.CLAIMED.value,
    orderIdx: TASK_STATUS_OBJ.CLAIMED.orderIdx,
  }
  // debugLog('claimTask', task)
  taskApi.cloudWhereUpdate({_id: task._id}
  , task
  , res => {
    // debugLog('claimedTask', res)
    utils.runCallback(callback)({ task: task, res: res })
  })
}

/**
 * 执行任务
 */
function implementTask(that, pTask, callback) {
  let task = Object.assign({}, pTask)
  let now = new Date()
  task.implementTime = now.getTime();
  task.implementTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.IMPLEMENTING.name,
    value: TASK_STATUS_OBJ.IMPLEMENTING.value,
    orderIdx: TASK_STATUS_OBJ.IMPLEMENTING.orderIdx,
  }
  // debugLog('implementTask', task)
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('implementTask', res)
      utils.runCallback(callback)({ task: task, res: res })
    })
}

/**
 * 完成任务
 */
function finishTask(that, pTask, callback) {
  let task = Object.assign({}, pTask)
  let now = new Date()
  task.finishTime = now.getTime();
  task.finishTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.FINISHED.name,
    value: TASK_STATUS_OBJ.FINISHED.value,
    orderIdx: TASK_STATUS_OBJ.FINISHED.orderIdx,
  }
  // 一分钟宽容度
  if(task.leftTime){
    if (Math.floor(
      task.leftTime / that.data.TASK_FINISH_STATUS_OBJ.FINISHED_AHEAD.around
        ) > 1){
      // 提前完成
      task['finishStatus'] = that.data.TASK_FINISH_STATUS_OBJ.FINISHED_AHEAD
    } else if (Math.abs(Math.floor(
      task.leftTime / that.data.TASK_FINISH_STATUS_OBJ.FINISHED_ONTIME.around
      )) < 1){
      // 准时完成
      task['finishStatus'] = that.data.TASK_FINISH_STATUS_OBJ.FINISHED_ONTIME
    } else if (task.leftTime < 0) {
      // 延时完成
      task['finishStatus'] = that.data.TASK_FINISH_STATUS_OBJ.FINISHED_OVER_TIME
    }
  }
  // debugLog('finish Task', task)
  taskApi.cloudWhereUpdate({_id: task._id }
    , task
    , res => {
      // debugLog('createTask', res)
      if (task.toWho.openid == that.data.userInfo.openId) {
        //  如果是自己发给自己的任务，直接复核
        approveTask(that, task, callback)
      } else {
        //  如果不是自己发给自己的任务
        // debugLog('created Task', res)
        utils.runCallback(callback)({ task: task, res: res })
      }

  })
}

/**
 * 复核任务
 */
function approveTask(that, pTask, callback) {
  let task = Object.assign({}, pTask )
  let now = new Date()
  task.approveTime = now.getTime();
  task.approveTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.APPROVED.name,
    value: TASK_STATUS_OBJ.APPROVED.value,
    orderIdx: TASK_STATUS_OBJ.APPROVED.orderIdx,
  }
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('createTask', res)
      utils.runCallback(callback)({ task: task, res: res })
  })
}

/**
 * 取消任务
 */
function cancelTask(that, pTask, callback) {
  let task = Object.assign({}, pTask)
  let now = new Date()
  task.cancelTime = now.getTime();
  task.cancelTimeStr = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.CANCELED.name,
    value: TASK_STATUS_OBJ.CANCELED.value,
    orderIdx: TASK_STATUS_OBJ.CANCELED.orderIdx,
  }
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('cancelTask', res)
      utils.runCallback(callback)({ task: task, res: res })
    })
}

/**
 * 拒绝任务
 */
function rejectTask(that, pTask, callback) {
  let task = Object.assign({}, pTask )
  let now = new Date()
  task['rejectTime'] = now.getTime();
  task['rejectTimeStr'] = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.REJECTED.name,
    value: TASK_STATUS_OBJ.REJECTED.value,
    orderIdx: TASK_STATUS_OBJ.REJECTED.orderIdx,
  }
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('createTask', res)
      utils.runCallback(callback)({ task: task, res: res })
    })
}

/**
 * 删除任务
 */
function deleteTask(that, pTask, callback) {
  let task = Object.assign({}, pTask)
  let now = new Date()
  task['deleteTime'] = now.getTime();
  task['deleteTimeStr'] = utils.formatDateTime(now);
  task.status = {
    name: TASK_STATUS_OBJ.DELETED.name,
    value: TASK_STATUS_OBJ.DELETED.value,
    orderIdx: TASK_STATUS_OBJ.DELETED.orderIdx,
  }
  task['isRemoved'] = true
  taskApi.cloudWhereUpdate({ _id: task._id }
    , task
    , res => {
      // debugLog('createTask', res)
      utils.runCallback(callback)({task: task, res: res})
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

/**
 * 上传完文件后再更新记录
 */
function uploadAndUpdateTask(that, pTask, processFunc, isConfirm=true, beforeProcess, callback){
  let task = pTask
  var nextProcess = function(){
    utils.onLoading(MSG.PROCESSING)
    media.whenAllUploaded(task.finishImages
      , (filesPath) => {
        let curTask = task
        if (filesPath && filesPath.length > 0) {
          curTask['finishImages'] = filesPath
        }
        that.setData({
          curTask: curTask
        }, () => {
          // debugLog('finishImages', that.data.curTask.finishImages)
          processFunc(that, task, result => {
            wx.showToast({
              title: task.status.message,
              duration: gConst.TOAST_DURATION_TIME
            })
            utils.runCallback(callback)()
            utils.stopLoading()
            setTimeout(() => {
              that.triggerEvent('refresh', { upTask: result.task })
              dialogCommon.onClose(null, that)
            }, gConst.TOAST_DURATION_TIME / 2)
            return;
          })
        })
      })
  }
  beforeProcess(nextProcess)
}

/**
 * 更新任务状态
 */
function updateTaskStatus(that, e, pTask, isConfirm=true, callback ) {
  let dataset = utils.getEventDataset(e)
  let toUpdateStatus = dataset.toUpdateStatus
  let TASK_STATUS_OBJ = that.data.TASK_STATUS_OBJ
  let task = pTask
  let processFunc = null
  let isDone = false
  switch (toUpdateStatus.value) {
    case 'ASSIGNED':
      processFunc = createTask
      break;
    case 'CLAIMED':
      processFunc = claimTask
      break;
    case 'IMPLEMENTING':
      isDone = true
      processFunc = implementTask
    case 'FINISHED':
      if (!processFunc){
        isDone = true
        processFunc = finishTask
      }
      uploadAndUpdateTask(that, task, processFunc, isConfirm, 
      (nextProcess) => {
        if (isConfirm) {
          wx.showModal({
            title: MSG.CONFIRM_UPDATE_TITLE,
            content: MSG.CONFIRM_UPDATE_MSG,
            success(res) {
              if (res.confirm) {
                utils.runCallback(nextProcess)()
              } else if (res.cancel) {
                errorLog('用户点击取消')
              }
            }
          })
        } else {
          utils.runCallback(nextProcess)()
        }
      }, 
      () => {
        utils.runCallback(callback)()
      })
      break;
    case 'APPROVED':
      processFunc = approveTask
      break;
    case 'CANCELED':
      processFunc = cancelTask
      break;
    case 'DELETED':
      processFunc = deleteTask
      break;
    case 'REJECTED':
      processFunc = rejectTask
      break;
    default:
  }
  if (isDone) {
    return;
  }
  if(isConfirm){
    wx.showModal({
      title: MSG.CONFIRM_UPDATE_TITLE,
      content: MSG.CONFIRM_UPDATE_MSG,
      success(res) {
        if (res.confirm) {
          processFunc(that, task, result => {
            utils.runCallback(callback)()
            wx.showToast({
              title: that.data.curTask.status.message,
              duration: gConst.TOAST_DURATION_TIME
            })
            setTimeout(() => {
              that.triggerEvent('refresh', { upTask: result.task })
              dialogCommon.onClose(null, that)
            }, gConst.TOAST_DURATION_TIME / 2)
          })
        } else if (res.cancel) {
          errorLog('用户点击取消')
        }
      }
    })
  }else{
    processFunc(that, task, result => {
      utils.runCallback(callback)()
      wx.showToast({
        title: that.data.curTask.status.message,
        duration: gConst.TOAST_DURATION_TIME
      })
      setTimeout(() => {
        that.triggerEvent('refresh', { upTask: result.task })
        dialogCommon.onClose(null, that)
      }, gConst.TOAST_DURATION_TIME / 2)
    })
  }
}

module.exports = {
  /** 常量 */
  TASK_DIRECT_OBJ: TASK_DIRECT_OBJ,
  TASK_DIRECT: TASK_DIRECT,

  /** common */
  initPage: initPage,
  getTaskTemplate: getTaskTemplate,
  updateTaskStatus: updateTaskStatus,

  /** Editor */
  defaultEditorData: defaultEditorData,
  initEditor: initEditor,
  uploadAndUpdateTask: uploadAndUpdateTask,

  /** 任务生命周期 */
  createTask: createTask,
  claimTask: claimTask,
  implementTask: implementTask,
  finishTask: finishTask,
  approveTask: approveTask,
  cancelTask: cancelTask,
  deleteTask: deleteTask,
  rejectTask: rejectTask,
  whenIsShown: whenIsShown,


  /** List */
  defaultListData: defaultListData,
  initList: initList,
  showTaskEditor: showTaskEditor,
  refreshMyTasks: refreshMyTasks,
  refreshTasks: refreshTasks,
}