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
  debugLog('tableName', tableName)
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = {
    table: tableName,
  }
  Object.assign(where, pWhere)
  debugLog('where', where)
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
  debugLog('answerTypeStatsitic.where', pWhere)
  let answerTypes=[];
  let perPageCount = 20
  try{
    let answerTypesObj = wx.getStorageSync(gConst.CONFIG_TAGS.ANSWER_TYPE)
    debugLog('answerTypeStatsitic.answerTypesObj', answerTypesObj)
    for (let i in answerTypesObj){
      answerTypes.push(answerTypesObj[i].name)
    }
    debugLog('answerTypeStatsitic.answerTypes', answerTypes)
  }catch(e){}
  let where = {
    answerType:  _.or(answerTypes)
  }
  Object.assign(where, pWhere)
  if (typeof pageIdx != 'number') {
    pageIdx = 0
  }
  debugLog('questCorrectStat.where', where)
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

module.exports = {
  answerTypeStatsitic: answerTypeStatsitic,
  dailyStatistic: dailyStatistic,
  tagsStatistic: tagsStatistic,
  getHistoryQuestions: getHistoryQuestions,
  questCorrectStat: questCorrectStat,
  getTags: getTags,
  create: create,
}