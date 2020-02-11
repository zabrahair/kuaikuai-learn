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
        // debugLog('spellEnglishWordsQuery.questions.count', res.result.data.length)
        if (res.length && res.length > 0) {
          let questions = that.data.questions.concat(res)
          that.setData({
            questions: questions,
          }, function () {
            if (pageIdx == 0) {
              // 生成下一道题目
              that.onClickNextQuestion(null, null, 0)
            }
          })
        } else {
          clearInterval(dataLoadTimer)

        }
      })
    pageIdx++
  }, 1000)
}
module.exports = {
  getNormalQuestions: getNormalQuestions,
}