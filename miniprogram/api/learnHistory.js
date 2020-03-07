const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const TABLE = TABLES.LEARN_HISTORY;
const dbApi = require('db.js')

const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

const create = function (pHistory, callback) {
  const db = wx.cloud.database()
  let history = {}
  let now = new Date();
  let nowTimeString = now.toString();
  Object.assign(history, pHistory)
  Object.assign(history, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  // debugLog('favorite', favorite)
  // 根据条件插入所有用户
  db.collection(TABLE).add({
    data: history,
    success: res => {
      let result = res;
      debugLog('【插入结果】 history', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '插入记录失败'
      })
      debugLog('[数据库history] [插入记录] 失败：', err)
    }
  })
}

function dailyStatistic(userInfo, whereFilter, pageIdx, callback){
  if (typeof pageIdx != 'number') {
    pageIdx = 0
  }
  dbApi.groupAggregate(TABLES.LEARN_HISTORY
    , whereFilter
    , '$openid'
    , {
      _id: {
        openid: '$openid',
        nickName: '$nickName',
        answerDate: '$answerTimeStr',
      },
      score: $.sum($.sum(['$question.score', '$score'])),
      avgThinkTime: $.avg('$thinkSeconds'),
      answerDate: $.first('$answerTimeStr'),
    }
    , {
      _id: 1,
      oldScore: 1,
      score: 1,
      avgThinkTime: 1,
      answerDate: 1,
    }
    , pageIdx
    , callback);
}

function tagsStatistic(userInfo, whereFilter, pageIdx, callback){
  if (typeof pageIdx != 'number'){
    pageIdx = 0
  }
  dbApi.groupAggregate(TABLES.LEARN_HISTORY
    , whereFilter
    , '$tags'
    , {
      _id: {
        openid: '$openid',
        nickName: '$nickName',
        tags: '$tags',
      },
      score: $.sum('$score'),
      avgThinkTime: $.avg('$thinkSeconds')
    }
    , {
      _id: 1,
      score: 1,
      avgThinkTime: 1,
    }
    , pageIdx
    , callback);
}

function getHistoryQuestions(userInfo, whereFilter, pageIdx, callback){
  dbApi.groupAggregate(TABLES.LEARN_HISTORY
    , whereFilter
    , '$_id'
    , {
      _id: '$question._id',
      question: $.first('$question'),

    }
    , {
      _id: 1,
      question: 1,
    }
    , pageIdx
    , callback);
}

function getTags(tableName, pWhere, pageIdx, callback) {
  // debugLog('tableName', tableName)
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = {
    table: tableName,
  }
  Object.assign(where, pWhere)
  // debugLog('where', where)
  db.collection(TABLE)
    .aggregate()
    .match(where)
    .unwind('$question.tags')
    .group({
      _id: '$question.tags',
      lastDate: $.max('$answerTimeStr'),
      count: $.sum(1),
    })
    .skip(pageIdx * perPageCount)
    .end()
    .then
    (res => {
      // debugLog('getTags', res)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        let tags = []
        for (let i in res.list) {
          tags.push({
            text: res.list[i]._id,
            count: res.list[i].count,
            lastDate: res.list[i].lastDate,
          })
        }
        callback(tags, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
}

/**
 * 统计特定Tags的题目的对错情况
 */
function questCorrectStat(tableName, pWhere, pageIdx, callback){
  // debugLog('questCorrectStat.tableName', tableName)
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = {
    table: tableName,
    question: pWhere
  }

  // debugLog('questCorrectStat.where', where)
  db.collection(TABLE)
    .aggregate()
    .match(where)
    .group({
      _id: {
        _id: '$question._id',
        isCorrect: '$isCorrect'
      },
      question: $.first('$question'),
      isCorrect: $.first('$isCorrect'),
      lastDate: $.max('$answerTimeStr'),
      count: $.sum(1),
    })
    .project({
      _id: 1,
      lastDate: 1,
      question: 1,
      isCorrect: 1,
      correct: $.cond({if: '$isCorrect', then: '$count', else: 0,}),
      incorrect: $.cond({ if: '$isCorrect', then: 0, else: '$count', }),
    })
    .group({
      _id: '$question._id',
      question: $.first('$question'),
      lastDate: $.first('$lastDate'),
      correct: $.sum('$correct'),
      incorrect: $.sum('$incorrect'),
    })
    .project({
      _id: 1,
      question: 1,
      lastDate: 1,
      correct: 1,
      incorrect: 1,
      leftCorrect: $.subtract(['$correct','$incorrect'])
    })
    .skip(pageIdx * perPageCount)
    .end()
    .then
    ((res, e) => {
      // debugLog('questCorrectStat.res', e)
      // debugLog('questCorrectStat.res', res.list)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        callback(res.list, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
    .catch(err => console.error(err))
}

/**
 * 按题型统计
 */
function answerTypeStatsitic(pWhere, pageIdx, callback){
  // debugLog('answerTypeStatsitic.where', pWhere)
  let answerTypes=[];
  let perPageCount = 20
  try{
    let answerTypesObj = wx.getStorageSync(gConst.CONFIG_TAGS.ANSWER_TYPE)
    // debugLog('answerTypeStatsitic.answerTypesObj', answerTypesObj)
    for (let i in answerTypesObj){
      answerTypes.push(answerTypesObj[i].name)
    }
    // debugLog('answerTypeStatsitic.answerTypes', answerTypes)
  }catch(e){}
  let where = {
    answerType:  _.or(answerTypes)
  }
  Object.assign(where, pWhere)
  if (typeof pageIdx != 'number') {
    pageIdx = 0
  }
  // debugLog('questCorrectStat.where', where)
  db.collection(TABLE)
    .aggregate()
    // .unwind('$question.tags')
    .match(where)
    .group({
      _id: {
        answerType: '$answerType',
        isCorrect: '$isCorrect'
      },
      isCorrect: $.first('$isCorrect'),
      count: $.sum(1),
    })
    .project({
      _id: 1,
      isCorrect: 1,
      correct: $.cond({ if: '$isCorrect', then: '$count', else: 0, }),
      incorrect: $.cond({ if: '$isCorrect', then: 0, else: '$count', }),
    })
    .group({
      _id: '$_id.answerType',
      correct: $.sum('$correct'),
      incorrect: $.sum('$incorrect'),
    })
    .project({
      _id: 1,
      correct: 1,
      incorrect: 1,
    })
    .skip(pageIdx * perPageCount)
    .end()
    .then
    ((res, e) => {
      // debugLog('questCorrectStat.res', e)
      // debugLog('questCorrectStat.res', res.list)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        callback(res.list, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
    .catch(err => console.error(err))
}

/**
 * 获得做过题目的数量
 */
function getHistoryCount(where, callback){

  // debugLog('getHistoryCount.where', where)
  db.collection(TABLE)
    .aggregate()
    .match(where)
    .group({
      _id: "计数",
      count: $.sum(1),
    })
    .end()
    .then
    ((res, e) => {
      // debugLog('getHistoryCount.res', res)
      // debugLog('questCorrectStat.res', res.list)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        callback(res.list[0].count)
        return
      } else {
        callback(0)
      }
    })
    .catch(err => console.error(err))
}

/**
 * 找到特定题目的最新历史记录
 */
function findLastHistory(pQuestionTable, pQuestionId, callback){
  let qTable = pQuestionTable
  let qId = pQuestionId
  let where = {
    table: qTable,
    question: {
      _id: qId
    }
  }
  db.collection(TABLE)
    .where(where)
    .orderBy('answerTime', 'desc')
    .limit(1)
    .get()
    .then(res => {
      debugLog('findLastHistory', res)
      // debugLog('findLastHistory.length', res.data.length)
      if (res.data.length > 0) {
        callback(res.data[0])
        return
      } else {
        callback(null)
      }
    })
    .catch(err => {
      callback(null)
    })

}

/**
 * 按艾宾浩斯遗忘规律统计需要复习的题目
 */
const EBBING_STAT_MODE = {
  IN_TIME: 'IN_TIME',
  TIMEOUT: 'TIMEOUT'
}
function countEbbinghaus(pWhere, ebbingRate, pageIdx = 0, callback
                          , mode = EBBING_STAT_MODE.IN_TIME){
  let perPageCount = 20
  let now = new Date()
  let where = {
    ebbStamp: _.exists(true),
  }

  Object.assign(where, pWhere)
  let ebbingRates = utils.getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
  let nextRate = utils.nextEbbingRate(ebbingRate)
  // debugLog('now.getTime() - nextRate.from', now.getTime() - nextRate.from)
  // debugLog('now.getTime() - nextRate.to', now.getTime() - nextRate.to)
  let ebbingFrom = now.getTime() - nextRate.from
  let ebbingTo = now.getTime() - nextRate.to
  let finalMatch = {
    'ebbStamp.rate.name': ebbingRate.name,
  }
  // debugLog('finalMatch', finalMatch)
  if (mode == EBBING_STAT_MODE.IN_TIME) {
    // debugLog('mode', mode)
    finalMatch['ebbStamp.time'] = _.and([_.lt(ebbingFrom), _.gt(ebbingTo)])
  } else if (mode == EBBING_STAT_MODE.TIMEOUT) {
    // debugLog('mode', mode)
    finalMatch['ebbStamp.time'] = _.lt(ebbingTo)
  }
  // debugLog('ebbinghausCount.where', where)
  // 找出每道题目
  // 拥有EbbStamp的
  // 最新一条
  // 然后计算这样题目的条数
  db.collection(TABLE)
  .aggregate()
  .project({
    table: 1,
    answerTime: 1,
    question: 1,
    ebbStamp: 1,
  })
  .match(where)
  .sort({
    'question._id': 1,
    'ebbStamp.time': -1,
  })
  .group({
    _id: {
      table: '$table',
      qid: '$question._id',
    },
    answerTime: $.first('$answerTime'),
    question: $.first('$question'),
    ebbStamp: $.first('$ebbStamp'),
  })
  .project({
    _id: 1,
    answerTime: 1,
    question: 1,
    ebbStamp: 1,
    ebbingFrom: $.literal(now.getTime() - nextRate.from),
    ebbingTo: $.literal(now.getTime() - nextRate.to),
  })
  .match(finalMatch)
  .group({
    _id: {
      table: '$_id.table',
    },
    count: $.sum(1)
  })
  .end()
  .then(res => {
    // debugLog('countEbbinghaus[' + ebbingRate.name + "-" + mode + '].res', res)
      // debugLog('questCorrectStat.res', res.list)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        utils.runCallback(callback)(res.list)
        return
      } else {
        utils.runCallback(callback)([])
      }
  })
  .catch(err=>{
    utils.runCallback(callback)(null)
  })
}

/**
 * 按艾宾浩斯遗忘规律获取需要复习的题目
 */
function getEbbinghausQuestions(pWhere, ebbingRate, pageIdx = 0, callback
                                , mode = EBBING_STAT_MOD.IN_TIME) {
  let perPageCount = 20
  let now = new Date()
  let where = {
    ebbStamp: _.exists(true),
  }
  Object.assign(where, pWhere)
  let ebbingRates = utils.getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
  let nextRate = utils.nextEbbingRate(ebbingRate)
  // debugLog('now.getTime() - nextRate.from', now.getTime() - nextRate.from)
  // debugLog('now.getTime() - nextRate.to', now.getTime() - nextRate.to)
  let ebbingFrom = now.getTime() - nextRate.from
  let ebbingTo = now.getTime() - nextRate.to
  let finalMatch = {
    'ebbStamp.rate.name': ebbingRate.name,
  }
  // debugLog('finalMatch', finalMatch)
  if (mode == EBBING_STAT_MODE.IN_TIME) {
    // debugLog('mode', mode)
    finalMatch['ebbStamp.time'] = _.and([_.lt(ebbingFrom), _.gt(ebbingTo)])
  } else if (mode == EBBING_STAT_MODE.TIMEOUT) {
    // debugLog('mode', mode)
    finalMatch['ebbStamp.time'] = _.lt(ebbingTo)
  }
  // debugLog('ebbinghausCount.where', where)
  // 找出每道题目
  // 拥有EbbStamp的
  // 最新一条
  // 然后计算这样题目的条数
  db.collection(TABLE)
    .aggregate()
    .project({
      table: 1,
      answerTime: 1,
      question: 1,
      ebbStamp: 1,
    })
    .match(where)
    .sort({
      'question._id': 1,
      'ebbStamp.time': -1,
    })
    .group({
      _id: {
        table: '$table',
        qid: '$question._id',
      },
      answerTime: $.first('$answerTime'),
      question: $.first('$question'),
      ebbStamp: $.first('$ebbStamp'),
    })
    .project({
      _id: 1,
      answerTime: 1,
      question: 1,
      ebbStamp: 1,
    })
    .match(finalMatch)
    .project({
      _id: 1,
      answerTime: 1,
      question: 1,
      ebbStamp: 1,
    })
    .skip(perPageCount * pageIdx)
    .limit(perPageCount)
    .end()
    .then(res => {
      // debugLog('getEbbinghausQuestions[' + ebbingRate.name + "-" + mode + '].res', res)
      // debugLog('questCorrectStat.res', res.list)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        utils.runCallback(callback)(res.list)
        return
      } else {
        utils.runCallback(callback)([])
      }
    })
    .catch(err => {
      utils.runCallback(callback)(null)
    })
}

/**
 * 获取最新的做过的题目
 */
function getLastQuestions(pMatch, pageIdx = 0, callback, isCount){
  let perPageCount = 20
  let match = {
    ebbStamp: _.exists(true),
  }
  if (typeof pMatch == 'object'){
    Object.assign(match, pMatch)
  }
  let now = new Date()
  debugLog('match', match)
  debugLog('pageIdx', pageIdx)
  debugLog('isCount', isCount)
  let dbAggr = db.collection(TABLE).aggregate()
    .match(match)
    .project({
      table: 1,
      answerType: 1,
      answerTime: 1,
      answertimeStr: 1,
      question: {
        _id: 1,
        word: 1,
        topic: 1,
        author: 1,
        time: 1, 
        country: 1,
        meaning: 1,
        tags: 1,
      },
      ebbStamp: 1,
      isCorrect: 1,
    })
    .sort({
      'question._id': 1,
      'answerTime': -1,
    })
    .group({
      _id: '$question._id',
      table: $.first('$table'),
      answerType: $.first('$answerType'),
      answerTime: $.first('$answerTime'),
      answertimeStr: $.first('$answerTimeStr'),
      question: $.first('$question'),
      ebbStamp: $.first('$ebbStamp'),
      isCorrect: $.first('$isCorrect'),
      count: $.sum(1),
    })
    .project({
      _id: 1,
      table: 1,
      answerType: 1,
      answerTime: 1,
      answertimeStr: 1,
      question: 1,
      ebbStamp: 1,
      isCorrect: 1,
      count: 1,
      fromNowTime: $.subtract([now.getTime(), '$answerTime'])
    })
    .sort({
      'fromNowTime': -1,
    })
  // 计数和拿记录分开
  if(isCount){
    dbAggr
      .count('total')
      .end()
      .then(res => {
        debugLog('getLastQuestions.res', res)
        if (res.list[0] && res.list[0].total > 0) {
          utils.runCallback(callback)(res.list[0].total)
          return
        } else {
          utils.runCallback(callback)(0)
        }
      })
      .catch(err => {
        errorLog('getLastQuestions.err', err.stack)
        utils.runCallback(callback)(-1)
      })    

  }else{
    dbAggr
      .skip(perPageCount * pageIdx)
      .limit(perPageCount)
      .end()
      .then(res => {
        debugLog('getLastQuestions.res', res)
        // debugLog('questCorrectStat.res', res.list)
        // debugLog('getTags.length', res.list.length)
        if (res.list.length > 0) {
          utils.runCallback(callback)(res.list)
          return
        } else {
          utils.runCallback(callback)([])
        }
      })
      .catch(err => {
        utils.runCallback(callback)(null)
      })
  }


}

/**
 * 获取单个题目的所有做题历史记录
 */
function getAllHistory(pWhere, pageIdx, callback, pOrderBy, isCount=false){
  let perPageCount = 20
  let where = {
  }
  if (typeof pWhere == 'object') {
    Object.assign(where, pWhere)
  }

  let dbSearch = 
  db.collection(TABLE)
    .where(where)
    .field({
      table: true,
      answerType: true,
      answerTime: true,
      answerTimeStr: true,
      question: {
        _id: true,
        word: true,
        topic: true,
        author: true,
        time: true,
        country: true,
      },
      ebbStamp: true,
      isCorrect: true,      
    })
    .orderBy(pOrderBy.field, pOrderBy.direct)

  if(isCount){
    dbSearch
      .count()
      .then(res => {
        // debugLog('getAllHistory.res', res)

        if (res.total > 0) {
          utils.runCallback(callback)(res.total)
          return
        } else {
          utils.runCallback(callback)(0)
        }
      })
      .catch(err => {
        utils.runCallback(callback)(-1)
      })
  }else{
    dbSearch
      .skip(perPageCount * pageIdx)
      .limit(perPageCount)
      .get()
      .then(res => {
        // debugLog('getAllHistory.res', res)

        if (res.data.length > 0) {
          utils.runCallback(callback)(res.data)
          return
        } else {
          utils.runCallback(callback)([])
        }
      })
      .catch(err => {
        utils.runCallback(callback)(null)
      })
  }
}
module.exports = {
  EBBING_STAT_MODE: EBBING_STAT_MODE,
  answerTypeStatsitic: answerTypeStatsitic,
  getHistoryCount: getHistoryCount,
  dailyStatistic: dailyStatistic,
  tagsStatistic: tagsStatistic,
  getHistoryQuestions: getHistoryQuestions,
  questCorrectStat: questCorrectStat,
  getTags: getTags,
  create: create,
  findLastHistory: findLastHistory,
  countEbbinghaus: countEbbinghaus,
  getEbbinghausQuestions: getEbbinghausQuestions,
  getLastQuestions: getLastQuestions,
  getAllHistory: getAllHistory,
}
