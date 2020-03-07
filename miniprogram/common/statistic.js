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
  let EBBINGHAUS_RATES = utils.getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
  let EBBINGHAUS_RATES_OBJ = utils.array2Object(EBBINGHAUS_RATES, 'name');
  // userInfo
  let userInfo = utils.getUserInfo(globalData)
  // userRole
  let userRole = userInfo.userRole
  that.setData({
    gConst: gConst,
    openid: userInfo._openid,
    userInfo: userInfo,
    userRole: userRole,
    USER_ROLES: USER_ROLES,
    ANSWER_TYPE: ANSWER_TYPE,
    ANSWER_TYPE_OBJ: ANSWER_TYPE_OBJ,
    EBBINGHAUS_RATES: EBBINGHAUS_RATES,
    EBBINGHAUS_RATES_OBJ: EBBINGHAUS_RATES_OBJ,
    curItem: null
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
    let options = that.data.options
    that.setData({
      // 下拉列表
      filtersAnswerType: [FILTER_ALL].concat(that.data.ANSWER_TYPE),
      filtersTable: [FILTER_ALL].concat(TABLES.LIST),
      filtersEbbinghaus: [FILTER_ALL].concat(that.data.EBBINGHAUS_RATES),
      // 当先选项
      today: utils.formatDate(new Date()),
      ifUsingFromDate: true,
      curFilterFromDate: options.fromDate ? options.fromDate : utils.formatDate(new Date()),
      curFilterTable: FILTER_ALL,
      curFilterAnswerType: options.answerType ? utils.getObjFromArray(that.data.ANSWER_TYPE, 'name', options.answerType) : FILTER_ALL,
      curFilterEbbinghaus: FILTER_ALL,
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
function refreshList(that, isReset, callbackOnQuery, callbackOnCount, ) {
  // 判断是否从头刷新
  let pageIdx = that.data.pageIdx
  if (isReset) {
    pageIdx = 0
  } else {
  }
  that.setData({
    pageIdx: pageIdx,
    now: new Date().getTime(),
  }, () => {
    let where = {}
    let lastDate = utils.getDateFromStr(that.data.curFilterFromDate)
    // debugLog('lastDate', lastDate)
    if (that.data.curFilterFromDate && that.data.ifUsingFromDate){
      where = Object.assign(where, {
        answerTime: _.gte(lastDate.getTime())
      })
    }

    if (that.data.curFilterTable 
      && that.data.curFilterTable.value != 'ALL') {
      where = Object.assign(where, {
        table: that.data.curFilterTable.value
      })
    }

    if (that.data.curFilterAnswerType 
      && that.data.curFilterAnswerType.value != 'ALL') {
      where = Object.assign(where, {
        answerType: that.data.curFilterAnswerType.name
      })
    }

    if (that.data.curFilterEbbinghaus
      && that.data.curFilterEbbinghaus.value != 'ALL') {
      where = Object.assign(where, {
        ebbStamp: {
          rate: {
            name: that.data.curFilterEbbinghaus.name
          }
        }
      })
    }

    if(isReset){
      let isCount = isReset
      learnHistoryApi.getLastQuestions(
          where
        , pageIdx
        , (totalCount => {
          debugLog('total', totalCount)
          that.setData({
            totalCount: totalCount
          }, () => {
            that.refreshTotalCount(totalCount)
            utils.runCallback(callbackOnCount)()
          })
      })
      , isCount)
    }

    learnHistoryApi.getLastQuestions(where, pageIdx, (list=>{
      // debugLog('list', list)
      let questions = that.data.questions
      if(list && list.length > 0){
        pageIdx = pageIdx + 1
        questions = isReset ? list : questions.concat(list)

      }else{
        if(isReset){
          questions = []
          pageIdx = 0
        }
      }
      that.setData({
        questions: questions,
        pageIdx: pageIdx,
      },()=>{
        utils.runCallback(callbackOnQuery)()
      })
    }))
  })
}

/**
 * 刷新历史详情页面
 */
function refreshDetailList(that, isReset) {
  // 判断是否从头刷新
  let pageIdx = that.data.pageIdx
  if (isReset) {
    pageIdx = 0
  } else {
  }
  that.setData({
    pageIdx: pageIdx,
    now: new Date().getTime(),
  }, () => {
    let where = {
      table: that.data.curItem.table,
      question: {
        _id: that.data.curItem.question._id
      }
    }
    let orderBy = {
      field: 'answerTime',
      direct: 'desc' 
    }

    
    if(isReset){
      let isCount = true
      learnHistoryApi.getAllHistory(where, null, totalCount => {
        debugLog('total', totalCount)
        that.setData({
          totalCount: totalCount
        })
      }, orderBy, isCount)   
    }
     

    learnHistoryApi.getAllHistory(where, pageIdx, list => {
      // debugLog('list', list)
      let histories = that.data.histories
      if (list && list.length > 0) {
        pageIdx = pageIdx + 1
        histories = isReset ? list : histories.concat(list)
      } else {
        if(isReset){
          histories = []
          pageIdx = 0
        }
      }
      that.setData({
        histories: histories,
        pageIdx: pageIdx,
      })
    }, orderBy)
  })
}

/**
 * 显示题目详情
 */
function showQuestionDetail(that) {
  that.setData({
    isShownQuestDetailStat: true
  })
}

/**
 * 当题目历史详情现实的时候
 */
function whenIsShown(that){
  that.setData({
    histories: [],
    totalCount: 0,    
  },()=>{
    let userInfo = that.data.userInfo
    try {
      refreshDetailList(that, true)
    } catch (err) { errorLog('err', err.stack) } 
  })
}

module.exports = {
  /** common */
  initPage: initPage,
  /** List */
  defaultListData: defaultListData,
  initList: initList,
  refreshList: refreshList,
  showQuestionDetail: showQuestionDetail,

  /** Detail Reviewer */
  whenIsShown: whenIsShown,
  refreshDetailList: refreshDetailList,
}