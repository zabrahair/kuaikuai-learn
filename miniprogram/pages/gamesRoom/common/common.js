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
const configsApi = require('../../../api/configs.js')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

/** 题目内容展示页 内容 */

/**
   * Reset Current Questions Status
   */
function resetQuestionStatus(that, e, scoreTimer) {
  let formValues = e ? e.detail.value : {}
  // Reset Questions
  let questions = that.data.questions
  let questionsDone = that.data.questionsDone
  let question = that.data.curQuestion
  let curQuestionIndex = that.data.curQuestionIndex
  for (let i in questionsDone) {
    questions.push(questionsDone[i])
  }
  questionsDone = []
  curQuestionIndex = 0
  that.setData({
    // 答题连击的恢复初始化
    hitsCount: 0,
    isShowPointLayer: false,
    hitsAccuScore: 0,
    curIsCorrect: false,
    curAnswer: false,

    questions: questions,
    questionsDone: questionsDone,
    curQuestionIndex: curQuestionIndex,
  })
  onClickNextQuestion(that, null, null, 0)


  // debugLog('timer', utils.formatDeciTimer(1000*60*60*24*30*12))
  // 开始计时
  that.setData({
    curDeciSecond: 0,
    thinkSeconds: 0,

  })
  clearInterval(scoreTimer)
  scoreTimer = setInterval(function () {
    if (that.data.isPause == false) {
      let timer = that.data.curDeciSecond + that.data.timerInterval
      let thinkTimer = that.data.thinkSeconds + that.data.timerInterval
      that.setData({
        curDeciSecond: timer,
        thinkSeconds: thinkTimer,
        curDeciTimerStr: utils.formatDeciTimer(timer, 1),
        thinkSecondsStr: utils.formatDeciTimer(thinkTimer, 1),
        // totalScore: utils.getTotalScore(that.data.userInfo),
      })
    }
  }, that.data.timerInterval)
  wx.showToast({
    image: gConst.GAME_START_ICON,
    title: '',
    duration: 1000,
  })
}

/**
 * 提交做题记录
 */
function recordHistory(that, question, answer) {
  let historyRecord = {};
  historyRecord['table'] = that.data.tableValue
  historyRecord['question'] = question
  historyRecord['answerType'] = that.data.titleSubfix
  // delete question._id
  // Object.assign(historyRecord, question)
  Object.assign(historyRecord, answer)
  // debugLog('historyRecord', historyRecord)

  learnHistoryApi.create(historyRecord, (res)=>{
    debugLog('learnHistoryCreate.success.res', res)
  })

  // wx.cloud.callFunction({
  //   name: 'learnHistoryCreate',
  //   data: {
  //     hisRecord: historyRecord
  //   },
  //   success: res => {
  //     // debugLog('learnHistoryCreate.success.res', res)
  //   },
  //   fail: err => {
  //     errorLog('[云函数] 调用失败：', err)
  //   }
  // })
}

/**
   * 当点击收藏按钮
   */
function clickFavoriteSwitch(that, e) {
  // debugLog('clickFavoriteSwitch.dataset', e.target.dataset)
  let dataset = utils.getDataset(e)
  let curQuesId = dataset.curQuestionIndex

  if (that.data.isFavorited == true) {
    let curQuestion = that.data.curQuestion
    let tags = curQuestion.tags
    // delete favorite tag
    tags = tags.filter(ele => {
      return ele != gConst.IS_FAVORITED
    })
    // debugLog('curQuestion tags removed', tags)
    favoritesApi.removeFavorite(that.data.tableValue, curQuestion, res => {
      that.setData({
        isFavorited: false,
        curQuestion: curQuestion,
      })
    })

  } else if (that.data.isFavorited == false) {
    // set to favorited
    let curQuestion = that.data.curQuestion
    let tags = curQuestion.tags
    if (!tags.includes(gConst.IS_FAVORITED)) {
      tags.push(gConst.IS_FAVORITED)
    }
    // debugLog('curQuestion tags', tags)
    favoritesApi.createFavorite(that.data.tableValue, curQuestion
      , res => {
        that.setData({
          isFavorited: true,
          curQuestion: curQuestion,
        })
      })

  }
}

/**
 * 默写卡点击字卡片
 */
function onTapReciteCard(that, e, unusedCallback, usedCallback) {
  let dataset = utils.getDataset(e)
  // debugLog('onTapAnswerCard.dataset', dataset)
  let curSpellCards = that.data.curSpellCards;
  let cardIdx = parseInt(dataset.cardIdx)
  let curCard = curSpellCards[cardIdx];
  // 如果没有填写空档就选下一个

  // if (that.data.selectedCard
  //   && that.data.selectedCard.id != curCard.id) {
  //   wx.showToast({
  //     image: gConst.ERROR_ICON,
  //     title: MSG.CLICK_BLANK_FIRST,
  //     duration: 1000,
  //   })
  //   return;
  // }

  let selectedCard = dataset.spellCard

  if (curSpellCards[cardIdx].cardState == CARD_STATE.UNUSED) {
    // selectedCard.tempCardIdx = cardIdx
    curCard.cardState = CARD_STATE.USED
    try { unusedCallback(that, curSpellCards[cardIdx])}catch(e){}
  } else if (curSpellCards[cardIdx].cardState == CARD_STATE.USED) {
    curCard.cardState = CARD_STATE.UNUSED
    // debugLog('onTapReciteCard', that.data.curQuestion)
    try { usedCallback(that, curSpellCards[cardIdx])}catch (e) { }
    if (typeof curCard.usedBlankIdx == 'number') {
      // debugLog('typeof curCard.usedBlankIdx', typeof curCard.usedBlankIdx)
      // curSpellCards[curCard.usedBlankIdx].blankValue = BLANK_EMPTY
      // curSpellCards[curCard.usedBlankIdx].usedCardIdx = false
      // curCard.usedBlankIdx = false
    }
    selectedCard = false
  }
  // debugLog('selectCard', selectedCard)
  that.setData({
    curSpellCards: curSpellCards,
    selectedCard: selectedCard,
  })
  if (typeof callback == 'function') callback()
}

/**
   * 点击拼写字母卡片
   */
function onTapSpellCard(that, e, callback) {
  let dataset = utils.getDataset(e);
  // debugLog('onTapSpellCard.dataset', dataset)
  let curSpellCards = that.data.curSpellCards;
  let cardIdx = parseInt(dataset.cardIdx)
  let curCard = curSpellCards[cardIdx];
  // 如果没有填写空档就选下一个

  if (that.data.selectedCard
    && that.data.selectedCard.id != curCard.id) {
    wx.showToast({
      image: gConst.ERROR_ICON,
      title: MSG.CLICK_BLANK_FIRST,
      duration: 1000,
    })
    return;
  }

  let selectedCard = dataset.spellCard

  if (curSpellCards[cardIdx].cardState == CARD_STATE.UNUSED) {
    selectedCard.tempCardIdx = cardIdx
    curCard.cardState = CARD_STATE.USED
  } else if (curSpellCards[cardIdx].cardState == CARD_STATE.USED) {
    curCard.cardState = CARD_STATE.UNUSED
    if (typeof curCard.usedBlankIdx == 'number') {
      // debugLog('typeof curCard.usedBlankIdx', typeof curCard.usedBlankIdx)
      curSpellCards[curCard.usedBlankIdx].blankValue = BLANK_EMPTY
      curSpellCards[curCard.usedBlankIdx].usedCardIdx = null
      curCard.usedBlankIdx = null
    }
    selectedCard = false
  }
  // debugLog('selectCard', selectedCard)
  that.setData({
    curSpellCards: curSpellCards,
    selectedCard: selectedCard,
  })
  if (typeof callback == 'function') callback()
}

/**
  * Get Normal Question
  */
function getNormalQuestions(that, dataLoadTimer) {
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  // debugLog('getNormalQuestions.tags', that.data.tags)
  dataLoadTimer = setInterval(function () {
    dbApi.queryPages(
      that.data.tableValue,
      {
        tags: _.all(that.data.tags)
      },
      pageIdx,
      (res, pageIdx) => {
        // debugLog('getNormalQuestions.getWords.res', res)
        // debugLog('getNormalQuestions.getWords.pageIdx', pageIdx)
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
          // when finish questions load
          writeQuestionsCorrectStat(that, dataLoadTimer, res=>{
            // debugLog('getNormalQuestions.questions', that.data.questions)
            // debugLog('getNormalQuestions.questionsDone', that.data.questionsDone)
            clearInterval(dataLoadTimer)
          })
          
        }
      })
    pageIdx++
  }, utils.getDataLoadInterval())
}

/**
 * 将对错情况和当前题目合并
 */
function writeQuestionsCorrectStat(that, dataLoadTimer, callback){
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  // debugLog('writeQuestionsCorrectStat.questions', that.data.questions)
  dataLoadTimer = setInterval(function () {
    learnHistoryApi.questCorrectStat(that.data.tableValue, 
      { tags: _.all(that.data.tags) }, pageIdx, 
      (list, pageIdx) => {
        // debugLog('questionStatistic.pageIdx', pageIdx)
        // debugLog('questi/onStatistic.list', list)
        if (list.length && list.length > 0) {
          let questions = that.data.questions
          let questionsDone = that.data.questionsDone
          for (let i in list){
            delete list[i].question
            try{
              let foundInQuests = questions.find(quest => quest._id == list[i]._id)  

              Object.assign(foundInQuests, list[i])
            }catch(e){}

            try {
              let foundInDones = questionsDone.find(quest => quest._id == list[i]._id)
              Object.assign(foundInDones, list[i])
            } catch (e) { }
          }
          that.setData({
            questions: questions,
            questionsDone: questionsDone,
          }, function () {

          })
        } else {
          // when finish questions load
          clearInterval(dataLoadTimer)
          callback()
        }
      
    })
    pageIdx++
  }, utils.getDataLoadInterval())
}

/**
 * 显示加分数动画
 */
const MAX_HITS = 30
function scoreApprove(that, curQuestion, isCorrect, callback) {
  // debugLog('showAddScoreEffect.hitsCount', that.data.hitsCount)
  // debugLog('showAddScoreEffect.isShowPointLayer', that.data.isShowPointLayer)
  let score = curQuestion.score
  let hitsCount = that.data.hitsCount
  let hitsAccuScore = that.data.hitsAccuScore
  let isShowPointLayer = true
  let curIsCorrect = false
  if (isCorrect) {
    curQuestion['isCorrect'] = isCorrect
    if (hitsCount == MAX_HITS){
      hitsAccuScore = 0
      hitsCount=0
    }
    hitsAccuScore += curQuestion.score
    hitsCount++
    curIsCorrect = true
  } else {
    hitsAccuScore = 0
    hitsCount = 0
    curIsCorrect = false
  }
  // debugLog('showAddScoreEffect.hitsCount', hitsCount)
  // debugLog('showAddScoreEffect.isShowPointLayer', isShowPointLayer)
  that.setData({
    isShowPointLayer: isShowPointLayer,
    hitsCount: hitsCount,
    hitsAccuScore: hitsAccuScore,
    curIsCorrect: curIsCorrect
  }, callback(that, curQuestion))
}

/**
 * 关闭显示得分层
 */
function finishScoreApprove(that, params) {
  // debugLog('closePointLayer.params', params)
  // 将返回的积分数据合并到历史记录中然后加入
  let recQuest = Object.assign({}, that.data.curQuestion)
  try {
    if (params.detail.isCorrect) {
      recQuest.score = recQuest.score + params.detail.hitsScore
      recQuest.tags.push(params.detail.hitsClass)
    } else {
    }
  } catch (e) { }
  // debugLog('finishScoreApprove.that.data.curQuestion', that.data.curQuestion)
  // debugLog('finishScoreApprove.recQuest', recQuest)
  // Record History
  let answerTime = new Date()
  recordHistory(that, recQuest
    , {
      openid: that.data.userInfo.openId,
      nickName: that.data.userInfo.nickName,
      userRole: that.data.userInfo.userRole,
      answer: that.data.curAnswer,
      isCorrect: params.detail.isCorrect,
      answerTime: answerTime.getTime(),
      answerTimeStr: utils.formatDate(answerTime),
      // 减去一个计时间隔，作为操作时间
      thinkSeconds: that.data.thinkSeconds - that.data.timerInterval,
    })
  
  let curScore = parseFloat(that.data.curScore) + parseFloat(recQuest.score)
  let totalScore = parseFloat(that.data.totalScore) + recQuest.score
  try{
    curScore = curScore.toFixed(1)
    totalScore = totalScore.toFixed(1)
  }catch(e){}
  // debugLog('closePrecQuestointLayer.curScore', curScore)
  // debugLog('closePrecQuestointLayer.totalScore', totalScore)
  that.setData({
    curScore: curScore,
    totalScore: totalScore,
  }, function (res) {
    wx.setStorageSync(storeKeys.totalScore, parseFloat(that.data.totalScore))
  })    
  that.setData({
    isShowPointLayer: false,
  }, res => {
    // Next Question
    // debugLog('closePrecQuestointLayer.isCorrect', params.detail.isCorrect)
    onClickNextQuestion(that, null, params.detail.isCorrect)
  })
}

/**
 * tap Select Option
 * 
 */
function tapSelectOption(that, e) {
  // debugLog('tapTag.e.target.dataset', e.target.dataset)
  let dataset = utils.getDataset(e)
  let optionText = dataset.optionText
  let optionIdx = parseInt(dataset.optionIdx)
  let selectedOptions = that.data.selectedOptions
  let curOptions = that.data.curOptions

  let isFound = false
  for (let i in selectedOptions) {
    // debugLog('tapSelectOption.curOptions[optionIdx]', curOptions[optionIdx])
    if (selectedOptions[i].text == optionText) {
      selectedOptions.splice(i, 1)
      curOptions[optionIdx].state = OPTION_STATE.UNSELECTED
      isFound = true
      break;
    }
  }

  if (isFound == false) {
    curOptions[optionIdx].state = OPTION_STATE.SELECTED
    selectedOptions.push(
      {
        text: optionText,
      }
    )
  }
  // debugLog('tapSelectOption', e.target.dataset)
  that.setData({
    selectedOptions: selectedOptions,
    curOptions: curOptions,
  })
}

/**
  * 获得收藏题目
  */
function getFavoritesQuestions(that, mode, dataLoadTimer, callback) {
  let pageIdx = 0
  let userInfo = that.data.userInfo
  // debugLog('that.data.lastDate', that.data.lastDate)
  // debugLog('that.data.lastTime', that.data.lastTime)
  let filterDate = utils.mergeDateTime(that.data.lastDate, that.data.lastTime).getTime();
  // debugLog('getFavoritesQuestions.filterDate', filterDate)
  let wherefilters
  if (gConst.GAME_MODE.FAVORITES == mode) {
    wherefilters = {
      tags: _.all(that.data.tags)
    }
  }
  clearInterval(dataLoadTimer)
  dataLoadTimer = setInterval(function () {
    favoritesApi.getFavorites(
      that.data.tableValue
      , wherefilters
      , pageIdx
      , (things, pageIdx) => {
        debugLog('favoritesApi.getFavorites', things)
        if (things.length && things.length > 0) {
          try {
            let questions = that.data.questions.concat(things)
            that.setData({
              questions: questions,
            }, function () {
              if (pageIdx == 0) {
                // 生成下一道题目
                onClickNextQuestion(that, null, null, 0)
              }
            })
          } catch (e) {
            wx.showToast({
              image: gConst.ERROR_ICON,
              title: MSG.SOME_EXCEPTION,
              duration: 1000,
            })
          }
        } else {
          // when finish questions load
          writeQuestionsCorrectStat(that, dataLoadTimer, res => {
            clearInterval(dataLoadTimer)
          })
        }
        if (typeof callback == 'function'){
          callback(things, pageIdx)
        } 
      })
    pageIdx++
  }, utils.getDataLoadInterval())
}

// Page Const Value
const BLANK_EMPTY = '_'
const CARD_STATE = {
  UNUSED: 'card_unused',
  USED: 'card_used',
}
const SPELL_CARD_TEMPLATE = {
  id: 0,
  letter: '',
  cardState: CARD_STATE.UNUSED,
  isUsed: false,
  blankValue: BLANK_EMPTY,
  usedCardIdx: null,
  usedBlankIdx: null,
  tempCardIdx: null,
}

/**
 * 获得做地错的题目
 */
function getHistoryQuestions(that, mode, dataLoadTimer, callback) {
  let pageIdx = 0
  let userInfo = that.data.userInfo
  // debugLog('getHistoryQuestions.lastDate', that.data.lastDate)
  // debugLog('getHistoryQuestions.lastTime', that.data.lastTime)
  let filterDate = utils.mergeDateTime(that.data.lastDate, that.data.lastTime).getTime();
  debugLog('getHistoryQuestions.filterDate', filterDate)
  // debugLog('getHistoryQuestions.filterDateStr', utils.mergeDateTime(that.data.lastDate, that.data.lastTime))
  let wherefilters
  if (gConst.GAME_MODE.WRONG == mode) {
    wherefilters = _.and(
      {
        table: that.data.tableValue,
        question: _.exists(true),
        answerTime: _.gte(filterDate),
        question: {
          tags: _.all(that.data.tags)
        }
      },
      _.or([{ isCorrect: false },
        // { thinkSeconds: _.gt('$question.minFinishTime') }
      ]))
  }

  clearInterval(dataLoadTimer)
  dataLoadTimer = setInterval(function () {
    learnHistoryApi.getHistoryQuestions(userInfo
      , wherefilters
      , pageIdx
      , (res, pageIdx)  => {
        // debugLog('learnHistoryApi.getHistoryQuestions count', res.list.length)
        // debugLog('learnHistoryApi.getHistoryQuestions', res.list)
        try {
          if (res.list.length && res.list.length > 0) {
            let questions = []
            for (let i in res.list) {
              questions.push(res.list[i].question)
            }
            questions = that.data.questions.concat(questions)
            that.setData({
              questions: questions,
            }, function () {
              if (pageIdx == 0) {
                // 生成下一道题目
                debugLog('生成第一道题目', questions[0])
                onClickNextQuestion(that, null, null, 0)
              }
            })
          } else {
            // when finish questions load
            writeQuestionsCorrectStat(that, dataLoadTimer, res => {
              clearInterval(dataLoadTimer)
              if (typeof callback == 'function') {
                callback(things, pageIdx)
              } 
            })
          }
        } catch (e) {
          wx.showToast({
            image: gConst.ERROR_ICON,
            title: MSG.SOME_EXCEPTION,
            duration: 1000,
          })
        }
      })
    pageIdx++
  }, utils.getDataLoadInterval())
}

/** 选择题状态保存模版和选择状态 */
const OPTION_STATE = {
  SELECTED: 'selected',
  UNSELECTED: '',
}
const OPTION_CARD_TEMPLATE = {
  id: 0,
  text: '',
  state: '',
  isUsed: false,
}
/**
 * 处理当前选择题的答案和选项
 */
function processSelectOptions(that, question) {
  that.setData({
    curOptions: []
  })
  if (question.options && question.options.length > 0) {
    let curOptions = []
    let length = question.options.length
    // debugLog('length', length)
    for (let idx = 0; idx < length; idx++) {
      let cardObject = {}
      Object.assign(cardObject, OPTION_CARD_TEMPLATE)
      // debugLog('processSelectOptions.question.options[i]', question.options[i])
      cardObject.id = idx
      cardObject.text = question.options[idx]
      cardObject.state = OPTION_STATE.UNSELECTED
      curOptions.push(cardObject)
    }

    curOptions.sort((a,b)=>{
      return 0.5 - Math.random()
    })
    // debugLog('processSelectOptions.curOptions', curOptions)
    that.setData({
      curOptions: curOptions,
      // cardFontSize: cardFontSize,
    })
  }
}

/**
   * 处理当前题目的word字段，变成一张一张卡片
   * 7 cards in every line
   */
function processWordsIntoCards(that, question) {
  that.setData({
    curSpellCards: []
  })
  if (typeof question.word == 'string') {
    let letters = question.word.split('');
    let curSpellCards = []
    let length = letters.length
    // debugLog('length', length)
    for (let idx = 0; idx < length; idx++) {
      // debugLog('letters', letters)
      // let i = Math.floor(Math.random() * letters.length)
      // no need to random the order of word
      let i = 0;
      if(that.data.isRandomSpell){
        i = Math.floor(Math.random() * letters.length)
      }
      // debugLog('i', i)
      let cardObject = {}
      Object.assign(cardObject, SPELL_CARD_TEMPLATE)
      cardObject.id = idx
      cardObject.letter = letters[i]
      // cardObject.x = card_x_offset + idx % 7 * card_width
      // cardObject.y = card_y_offset + Math.floor(idx/7) * card_height
      // debugLog('cardObject', cardObject)
      curSpellCards.push(cardObject)
      letters.splice(i, 1)
    }

    // caculate font size:
    let questionViewWidth = that.data.questionViewWidth;
    let cardFontSize = questionViewWidth / curSpellCards.length;
    cardFontSize = cardFontSize > that.data.maxCardFontSize ? that.data.maxCardFontSize : cardFontSize
    cardFontSize = cardFontSize < that.data.minCardFontSize ? that.data.minCardFontSize : cardFontSize
    question.discount = question.score / length
    that.setData({
      curQuestion: question,
      curSpellCards: curSpellCards,
      cardFontSize: cardFontSize,
    })
  }
}

/**
 * 下一题
 */
function onClickNextQuestion(that, e, isCorrect, idxOffset, callback) {
  let dataset
  // try {
  dataset = e ? utils.getDataset(e) : null
  if (dataset && dataset.idxOffset) {
      idxOffset = parseInt(dataset.idxOffset)
    }
  // }
  // catch (e) {
  //   errorLog('onClickNextQuestion.e', e)
  // }

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
  // debugLog('onClickNextQuestion.questions', that.data.questions)
  let curQuestionIndex = that.data.curQuestionIndex
  // Set isCorrect to questions responsed element
  questions[curQuestionIndex]['isCorrect'] = isCorrect
  let questionsDone = that.data.questionsDone
  let question = that.data.curQuestion

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
    // 当所有题目做完
    wx.showModal({
      title: MSG.CONFIRM_TITLE,
      content: MSG.CONFIRM_FINISHED_MSG,
      success: function (res) {
        if (res.confirm) {
          that.resetAnswer();
          // for (let i in questionsDone) {
          //   questions.push(questionsDone[i])
          // }
          // questionsDone = []
          // curQuestionIndex = 0
          // question = {}
          // wx.showToast({
          //   image: gConst.ANSWER_CORRECT,
          //   title: MSG.FINISH_ALL_QUESTIONS,
          //   duration: 1000,
          // }, function () {

          // })
        }else{
          return;
        }
      }
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
  // debugLog('nextQuestion', nextQuestion)
  let timer = setTimeout(function () { 
    let speechText='';
    if (nextQuestion.word){
      speechText = nextQuestion.word
      readCurrentWord(that, speechText)
    }
    else if(nextQuestion.questionText){
      speechText = nextQuestion.questionText
    }
    
    clearTimeout(timer)
  }, 200);
  
  that.setData({
    // 共通是用的字段
    questions: questions,
    questionsDone: questionsDone,
    curQuestionIndex: nextQuestionIndex,
    curQuestion: nextQuestion,
    thinkSeconds: 0,
    // 填空题是用的字段
    curAnswer: '',
    // 默写卡和拼写是用的字段
    selectedCard: false,
    curSpellCards: false,

    // 选择题是用的字段
    curOptions: [],
    selectedOptions: [],
  }, res => {
    that.processCurrentQuestion(that, nextQuestion)
    if (that.myNextQuestionActions)that.myNextQuestionActions(that, nextQuestion)
  })
  // } catch (e) {
  //   errorLog('onClickNextQuestion error:', e)
  // }
}

/** TagRoom 内容 */

const DATA_BODY_IN_TAG_ROOM = {
  // common
  isLoadingFinished: false,
  gConst: gConst,

  selectedTable: '',
  userKeyword: null,

  // Picker of answerTypes

  selAnswerType: '选择题型',
  // 共通函数通过这个数值判断到那种表里面获取标签列表
  tagsLocation: gConst.TAGS_LOCATION.NORMAL,
}

function initDataBodyInTagRoom(that, diffs, callback){
  let initData = Object.assign({
    tables: [],
    tags: [],
    userKeyword: null,
    selectedTags: [],
    answerTypesObjects: [],
    answerTypesPickers: [],
  }, DATA_BODY_IN_TAG_ROOM)
  for (let i in diffs) {
    initData[i] = diffs[i]
  }
  for (let i in initData){
    that.setData({
      [i]: initData[i]
    })
  }
  that.setData({

  }, res=>{
    callback(res)
  })
}




/**
 * 获得Tags（根据传入的Tags来源切换
 */
function getTags(that, tableName, dataLoadTimer, callback) {
  // debugLog('getTags.tagsLocation', that.data.tagsLocation)
  if (that.data.tagsLocation == gConst.TAGS_LOCATION.NORMAL){

    getNormalTags(that, tableName, dataLoadTimer, callback)
  } else if (that.data.tagsLocation == gConst.TAGS_LOCATION.FAVORITES){
    getFavoriteTags(that, tableName, dataLoadTimer, callback)
  } else if (that.data.tagsLocation == gConst.TAGS_LOCATION.HISTORY) {
    getHistoryTags(that, tableName, dataLoadTimer, callback)
  } else if (that.data.tagsLocation == gConst.TAGS_LOCATION.WRONG_HISTORY) {
    that.setData({
      historyCorrectFlag: false
    })
    getHistoryTags(that, tableName, dataLoadTimer, callback)
  }
}

/**
 * 獲取所有的標籤,只获取标签在记录第一层的标签。
 */
function getNormalTags(that, tableName, dataLoadTimer) {
  debugLog('getNormalTags.tableName', tableName)
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  let where = {}

  let tagsConds = _
  // debugLog('getTags.selAnswerType', that.data.selAnswerType)
  if (that.data.selAnswerType) {
    tagsConds = tagsConds.and(that.data.selAnswerType)
  }
  // debugLog('getNormalTags.userKeyword', that.data.userKeyword)
  if (that.data.userKeyword) {
    // debugLog('getNormalTags.userKeyword2', that.data.userKeyword)
    tagsConds = tagsConds.and(new RegExp(that.data.userKeyword, "gim"))
    // tagsConds.and(/第一课/gi)
  }
  if (tagsConds){
    // where['tags'] = /第一课/gim
    // where['tags'] = _.and(that.data.selAnswerType, new RegExp("第一课", "gim"))
    where['tags'] = tagsConds
    // where['tags'] = _.and(that.data.selAnswerType).and(new RegExp(that.data.userKeyword, "gim"))
  }
  // debugLog('getNormalTags.where', where)
  dataLoadTimer = setInterval(function () {
    dbApi.getTags(tableName, where, pageIdx, (tags, pageIdx) => {
      // debugLog('getTags.pageIdx', pageIdx)
      // debugLog('getTags.tags', tags)
      if (!tags.length || tags.length < 1) {
        // stop load
        // debugLog('getNormalTags.sort', that.data.tags)
        let tags = that.data.tags
        let sortTags = utils.sortByPropLenArray(tags, 'text', utils.ORDER.DESC)
        // debugLog('getNormalTags.sort', that.data.tags)
        that.setData({
          tags: sortTags
        })
        clearInterval(dataLoadTimer)
      }
      // sort tags
      that.setData({
        tags: that.data.tags.concat(tags)
      })
    })
    pageIdx++;
  }, utils.getDataLoadInterval())
}

/**
 * 獲取收藏记录的所有的標籤
 */
function getFavoriteTags(that, tableName, dataLoadTimer) {
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  let where = {}
  // let tagsConds = _
  // // debugLog('getFavoriteTags.selAnswerType', that.data.selAnswerType)
  // if (that.data.selAnswerType) {
  //   tagsConds = tagsConds.and(that.data.selAnswerType)
  // }
  // // debugLog('getFavoriteTags.userKeyword', that.data.userKeyword)
  // if (that.data.userKeyword) {
  //   tagsConds = tagsConds.and(new RegExp(that.data.userKeyword, "gim"))
  //   // tagsConds.and(new RegExp("第一课", "gim"))
  // }
  // if (tagsConds) {
  //   where['tags'] = tagsConds
  //   // where['tags'] = tagsConds.and(new RegExp(that.data.userKeyword, "gim"))
  // }

  dataLoadTimer = setInterval(function () {
    favoritesApi.getTags(tableName, where, pageIdx, (tags, pageIdx) => {
      // debugLog('getTags.pageIdx', pageIdx)
      // debugLog('getTags.tags', tags)
      if (!tags.length || tags.length < 1) {
        // stop load
        let tags = that.data.tags
        let sortTags = utils.sortByPropLenArray(tags, 'text', utils.ORDER.DESC)
        that.setData({
          tags: sortTags
        })        
        clearInterval(dataLoadTimer)
      }
      // 
      that.setData({
        tags: that.data.tags.concat(tags)
      })
    })
    pageIdx++;
  }, utils.getDataLoadInterval())
}

/**
 * 獲取收藏记录的所有的標籤
 */
function getHistoryTags(that, tableName, dataLoadTimer) {
  let pageIdx = 0
  clearInterval(dataLoadTimer)
  let where = {}
  if (that.data.historyCorrectFlag == true || that.data.historyCorrectFlag == false){
    where = {
      isCorrect: that.data.historyCorrectFlag,
    }
  }

  let tagsConds = _
  debugLog('getFavoriteTags.selAnswerType', that.data.selAnswerType)
  if (that.data.selAnswerType) {
    tagsConds = tagsConds.and(that.data.selAnswerType)
  }
  debugLog('getFavoriteTags.userKeyword', that.data.userKeyword)
  if (that.data.userKeyword) {
    tagsConds = tagsConds.and(new RegExp(that.data.userKeyword, "gim"))
  }
  if (tagsConds) {
    where['tags'] = tagsConds
  }

  dataLoadTimer = setInterval(function () {
    learnHistoryApi.getTags(tableName, where, pageIdx, (tags, pageIdx) => {
      // debugLog('getTags.pageIdx', pageIdx)
      // debugLog('getTags.tags', tags)
      if (!tags.length || tags.length < 1) {
        // stop load
        let tags = that.data.tags
        let sortTags = utils.sortByPropLenArray(tags, 'text', utils.ORDER.DESC)
        that.setData({
          tags: sortTags
        }) 
        clearInterval(dataLoadTimer)
      }
      // 
      that.setData({
        tags: that.data.tags.concat(tags)
      })
    })
    pageIdx++;
  }, utils.getDataLoadInterval())
}



/**
 * 点击标签过滤页的表名
 */
const SELECTED_CSS = 'selected'
function tapFilterTable(that, e, dataLoadTimer, callback) {
  // debugLog('tapTag.e.target.dataset', e.target.dataset)
  let dataset = utils.getDataset(e)
  let tableValue = dataset.tableValue
  let tableIdx = parseInt(dataset.tableIdx)
  let selectedTable = that.data.selectedTable
  let tables = that.data.tables

  if (tableValue == selectedTable.value) {
    return;
  }

  clearInterval(dataLoadTimer)
  for (let i in tables) {
    if (i == tableIdx) {
      selectedTable = tables[i]
      tables[i]['css'] = SELECTED_CSS
      // common.getTags(that, tableValue, dataLoadTimer)
    } else {
      tables[i]['css'] = ''
    }
  }

  resetTagsPageSelected(that, ()=>{
    that.setData({
      tables: tables,
      selectedTable: selectedTable,
    }, res => {
      getTags(that, selectedTable.value, dataLoadTimer)
    })
  })

}

/**
 * 初始化过滤表名
 */
function initFilterTables(that, dataLoadTimer, callback){
  let tables = TABLES.LIST
  tables[0]['css'] = SELECTED_CSS
  that.setData({
    tables: tables,
    selectedTable: tables[0]
  }, res => {
    getTags(that, that.data.selectedTable.value, dataLoadTimer)
    // that.getTags(that.data.selectedTable.value);
  })
}

/**
 * 初始化题目类型
 */
function initFilterAnswerTypes(that) {
  // Set Answer Types
  let answerTypesObjects = wx.getStorageSync(gConst.CONFIG_TAGS.ANSWER_TYPE)
  // debugLog('initAnswerTypes.answerTypesObjects', answerTypesObjects)
  let answerTypesPickers = utils.getArrFromObjectsArr(answerTypesObjects, 'name')
  // debugLog('initAnswerTypes.answerTypesPickers', answerTypesPickers)
  let selAnswerType = answerTypesPickers.length > 0 ? answerTypesPickers[0] : ''

  that.setData({
    answerTypesPickers: answerTypesPickers,
    answerTypesObjects: answerTypesObjects,
    selAnswerType: selAnswerType,
  })
}

/**
 * tap Tag
 * 
 */
function tapTagInTagRoom(that, e) {
  // debugLog('tapTag.e.target.dataset', e.target.dataset)
  let dataset = utils.getDataset(e)
  let tagText = dataset.tagText
  let tagIdx = parseInt(dataset.tagIdx)
  let tagCount = dataset.tagCount
  let tagLastDate = dataset.tagLastDate
  let selectedTags = that.data.selectedTags
  let tags = that.data.tags

  let isFound = false
  for (let i in selectedTags) {
    if (selectedTags[i].text == tagText) {
      selectedTags.splice(i, 1)
      tags[tagIdx]['css'] = ''
      isFound = true
      break;
    }
  }

  if (isFound == false) {
    tags[tagIdx]['css'] = SELECTED_CSS
    selectedTags.push(
      {
        text: tagText,
        count: tagCount,
        lastDate: tagLastDate
      }
    )
  }

  that.setData({
    selectedTags: selectedTags,
    tags: tags,
  })
}

/**
 * 点击进入，切换到题目展示页
 */
function onClickEnterInTagRoom(that, e) {
  // debugLog('onClickEnterInTagRoom', that.data.selectedTags)
  let selectedTags = that.data.selectedTags
  let tagsStr = utils.arrayJoin(selectedTags, 'text')
  let url = ''
  if (that.data.selAnswerType == '默写卡') {
    url = '/pages/gamesRoom/words/words?gameMode=' + that.data.gameMode + '&tableValue=' + that.data.selectedTable.value + '&tableName=' + that.data.selectedTable.name + '&filterTags=' + tagsStr;
  } else if (that.data.selAnswerType == '拼写') {
    url = '/pages/gamesRoom/spell/spell?gameMode=' + that.data.gameMode + '&tableValue=' + that.data.selectedTable.value + '&tableName=' + that.data.selectedTable.name + '&filterTags=' + tagsStr;
  } else if (that.data.selAnswerType == '选择题') {
    url = '/pages/gamesRoom/optionsSelect/optionsSelect?gameMode=' + that.data.gameMode + '&tableValue=' + that.data.selectedTable.value + '&tableName=' + that.data.selectedTable.name + '&filterTags=' + tagsStr;
  } else if (that.data.selAnswerType == '自助默写') {
    url = '/pages/gamesRoom/selfRecite/selfRecite?gameMode=' + that.data.gameMode + '&tableValue=' + that.data.selectedTable.value + '&tableName=' + that.data.selectedTable.name + '&filterTags=' + tagsStr;
  }

  if(that.data.gameMode == gConst.GAME_MODE.WRONG){
    
    selectedTags.sort((a, b)=>{
      if(a.lastDate < b.lastDate){
        return -1
      } else if (a.lastDate > b.lastDate){
        return 1
      } else if (a.lastDate = b.lastDate){
        return 0
      }
    })
    let lastDate = selectedTags[0].lastDate
    lastDate = lastDate.replace(/\//g,'-')
    debugLog('selectedTags', selectedTags)
    url += '&lastDate=' + lastDate
  }
  wx.navigateTo({
    url: url
  })
}

/**
 * 朗读当前卡片
 */
const plugin = requirePlugin("WechatSI")
const audioCtx = wx.createInnerAudioContext()
function readCurrentWord(that, word) {
  let lang = '';
  try {
    lang = TABLES.MAP[that.data.tableValue].lang
  } catch (e) { }
  // debugLog("lang", lang)
  plugin.textToSpeech({
    lang: lang,
    tts: true,
    content: word,
    success: function (res) {
      // debugLog("textToSpeech.res.filename", res.filename)
      let ac = wx.createInnerAudioContext()
      ac.src = res.filename
      ac.play(res => {
        // debugLog('play source')
      })
    },
    fail: function (res) {
      errorLog("fail tts", res)
    }
  })
}

/**
 * 重置页面选择设定数据
 */
function resetTagsPageSelected(that, callback) {
  that.setData({
    tags: [],
    selectedTags: [],
  }, callback)
}

/**
 * 通过关键字过滤标签
 */
function onKeywordSearch(that, e, dataLoadTimer){
  let inputValue = utils.getEventDetailValue(e)
  resetTagsPageSelected(that, () => {
    that.setData({
      userKeyword: inputValue
    }, res => {
      getTags(that, that.data.selectedTable.value, dataLoadTimer)
    })
  }) 
}

module.exports = {
  /* 题目内容展示页 */
  /* -- 数据处理 -- */
  getNormalQuestions: getNormalQuestions,
  getFavoritesQuestions: getFavoritesQuestions,
  getHistoryQuestions: getHistoryQuestions,
  onClickNextQuestion: onClickNextQuestion,
  recordHistory: recordHistory,
  processWordsIntoCards: processWordsIntoCards,
  processSelectOptions: processSelectOptions,
  

  /* -- 页面事件 -- */
  clickFavoriteSwitch: clickFavoriteSwitch,
  onTapReciteCard: onTapReciteCard,
  onTapSpellCard: onTapSpellCard,
  resetQuestionStatus: resetQuestionStatus,
  tapSelectOption: tapSelectOption,
  readCurrentWord: readCurrentWord,
  scoreApprove: scoreApprove,
  finishScoreApprove: finishScoreApprove,

  /* -- 常量 -- */
  BLANK_EMPTY: BLANK_EMPTY,
  CARD_STATE: CARD_STATE,
  SPELL_CARD_TEMPLATE: SPELL_CARD_TEMPLATE,

  /* 标签过滤页 */
  /* -- 各种初始化 -- */
  initFilterTables: initFilterTables,
  initFilterAnswerTypes: initFilterAnswerTypes,
  initDataBodyInTagRoom: initDataBodyInTagRoom,
  resetTagsPageSelected: resetTagsPageSelected,

  getTags: getTags,
  getNormalTags: getNormalTags,
  getFavoriteTags: getFavoriteTags,
  getHistoryTags: getHistoryTags,

  tapFilterTable: tapFilterTable,
  tapTagInTagRoom: tapTagInTagRoom,
  onClickEnterInTagRoom: onClickEnterInTagRoom,
  onKeywordSearch: onKeywordSearch,

  /** 标签页的常量 */
  DATA_BODY_IN_TAG_ROOM: DATA_BODY_IN_TAG_ROOM,
}