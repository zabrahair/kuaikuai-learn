const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const dbApi = require('db.js')

const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

function dailyStatistic(userInfo, whereFilter, callback){
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
    , callback);
}

function tagsStatistic(userInfo, whereFilter, callback){
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
    , callback);
}

function getHistoryQuestions(userInfo, whereFilter, callback){
  dbApi.groupAggregate(TABLES.LEARN_HISTORY
    , whereFilter
    , '$openid'
    , {
      _id: {
        question: '$question'
      },
    }
    , {
      _id: 1,
    }
    , callback);
}

module.exports = {
  dailyStatistic: dailyStatistic,
  tagsStatistic: tagsStatistic,
  getHistoryQuestions: getHistoryQuestions,
}