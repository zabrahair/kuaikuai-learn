const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../../../const/message.js')
const debugLog = require('../../../utils/log.js').debug;
const errorLog = require('../../../utils/log.js').error;
const gConst = require('../../../const/global.js');
const storeKeys = require('../../../const/global.js').storageKeys;
const utils = require('../../../utils/util.js');
const TABLES = require('../../../const/collections.js')
// Api Handler
const dbApi = require('../../../api/db.js')
const favoritesApi = require('../../../api/favorites.js')
const userApi = require('../../../api/user.js')
const learnHistoryApi = require('../../../api/learnHistory.js')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

/**
  * Get Normal Question
  */
function getNormalQuestions(that, dataLoadTimer) {
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  dataLoadTimer = setInterval(function () {
    dbApi.queryPages(
      that.data.tableValue,
      {
        tags: _.all(that.data.tags)
      },
      pageIdx,
      (res, pageIdx) => {
        debugLog('getNormalQuestions.getWords.res', res)
        debugLog('getNormalQuestions.getWords.pageIdx', pageIdx)
        if (res.length && res.length > 0) {
          let questions = that.data.questions.concat(res)
          that.setData({
            questions: questions,
          }, function () {
            if (pageIdx == 0) {
              // 生成下一道题目
              onClickNextQuestion(that, null, null, 0)
            }
          })
        } else {
          clearInterval(dataLoadTimer)

        }
      })
    pageIdx++
  }, 1000)
}

/**
 * 下一题
 */
function onClickNextQuestion(that, e, isCorrect, idxOffset, callback) {
  let dataset
  try {
    dataset = e ? e.target.dataset : null
    if (dataset.idxOffset) {
      idxOffset = parseInt(dataset.idxOffset)
    }
  }
  catch (e) {
    errorLog('onClickNextQuestion.e', e)
  }

  if (that.checkPauseStatus()
    || !that.data.questions
    || that.data.questions.length <= 0) {
    return;
  }
  if (idxOffset == null) {
    idxOffset = 1
  }
  // try {

  let questions = that.data.questions
  let questionsDone = that.data.questionsDone
  let question = that.data.curQuestion
  let curQuestionIndex = that.data.curQuestionIndex
  let nextQuestionIndex
  if (curQuestionIndex == 0 && idxOffset < 0) {
    nextQuestionIndex = questions.length - 1
  } else {
    nextQuestionIndex = Math.abs((curQuestionIndex + idxOffset)) % questions.length
  }


  let nextQuestion = questions[nextQuestionIndex]
  if (isCorrect) {
    questionsDone.push(question)
    questions.splice(curQuestionIndex, 1)
    if (curQuestionIndex < nextQuestionIndex) {
      nextQuestionIndex -= 1
    }
  }


  if (questions.length > 0) {

  } else {
    for (let i in questionsDone) {
      questions.push(questionsDone[i])
    }
    questionsDone = []
    curQuestionIndex = 0
    question = {}
    wx.showToast({
      image: gConst.ANSWER_CORRECT,
      title: MSG.FINISH_ALL_QUESTIONS,
      duration: 1000,
    }, function () {

    })
  }

  let isFavorited = false
  favoritesApi.isFavorited(that.data.tableValue, {
    _id: nextQuestion._id
  }, res => {
    let thing = res
    if (thing) {
      that.setData({
        isFavorited: thing.isFavorited
      })
    } else {
      that.setData({
        isFavorited: false
      })
    }
  })

  // 重置变量
  debugLog('nextQuestion', nextQuestion)
  that.setData({
    questions: questions,
    questionsDone: questionsDone,
    curQuestionIndex: nextQuestionIndex,
    curQuestion: nextQuestion,
    curAnswer: '',
    selectedCard: false,
    curSpellCards: false,
    thinkSeconds: 0,
  }, res => {
    that.processCurrentQuestion(nextQuestion)
  })
  // } catch (e) {
  //   errorLog('onClickNextQuestion error:', e)
  // }
}

/**
 * 獲取所有的標籤,只获取标签在记录第一层的标签。
 */
function getTags(that, tableName, dataLoadTimer) {
  debugLog('getTags.tableName', tableName)
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  let where = {}
  debugLog('getTags.selAnswerType', that.data.selAnswerType)
  if (that.data.selAnswerType){
    where = {
      tags: that.data.selAnswerType
    }
  }
  dataLoadTimer = setInterval(function () {
    dbApi.getTags(tableName, where, pageIdx, (tags, pageIdx) => {
      // debugLog('getTags.pageIdx', pageIdx)
      // debugLog('getTags.tags', tags)
      if (!tags.length || tags.length < 1) {
        // stop load
        clearInterval(dataLoadTimer)
      }
      // 
      that.setData({
        tags: that.data.tags.concat(tags)
      })
    })
    pageIdx++;
  }, 500)
}

/**
 * 提交做题记录
 */
function recordHistory(that, question, answer) {
  let historyRecord = {};
  historyRecord['table'] = that.data.tableValue
  historyRecord['question'] = question
  // delete question._id
  // Object.assign(historyRecord, question)
  Object.assign(historyRecord, answer)
  // debugLog('historyRecord', historyRecord)
  wx.cloud.callFunction({
    name: 'learnHistoryCreate',
    data: {
      hisRecord: historyRecord
    },
    success: res => {
      // debugLog('learnHistoryCreate.success.res', res)
    },
    fail: err => {
      errorLog('[云函数] 调用失败：', err)
    }
  })
}

/**
 * 獲取收藏记录的所有的標籤
 */
function getFavoriteTags(that, tableName, dataLoadTimer) {
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  dataLoadTimer = setInterval(function () {
    favoritesApi.getTags(tableName, {}, pageIdx, (tags, pageIdx) => {
      // debugLog('getTags.pageIdx', pageIdx)
      // debugLog('getTags.tags', tags)
      if (!tags.length || tags.length < 1) {
        // stop load
        clearInterval(dataLoadTimer)
      }
      // 
      that.setData({
        tags: that.data.tags.concat(tags)
      })
    })
    pageIdx++;
  }, 500)
}

module.exports = {
  getNormalQuestions: getNormalQuestions,
  onClickNextQuestion: onClickNextQuestion,
  getTags: getTags,
  recordHistory: recordHistory,
  getFavoriteTags: getFavoriteTags,
}