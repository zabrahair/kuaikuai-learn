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
const userApi = require('../../../api/user.js')
const learnHistoryApi = require('../../../api/learnHistory.js')
const favoritesApi = require('../../../api/favorites.js')
const common = require('../common/common.js')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command
const MANUAL_CHECK_RESULT = {
  RIGHT: {
    name: '对',
    value: true,
  },
  WRONG: {
    name: '错',
    value: false,
  }
}
// 练习计时器
var scoreTimer = null;
var dataLoadTimer = null;
const titles = {
}

// Titles
titles[gConst.GAME_MODE.NORMAL] = '';
titles[gConst.GAME_MODE.FAVORITES] = '收藏'

// Alphabet Variables
const alphabet = "abcdefghijklmnopqrstuvwxyz"
const alphabetArray = alphabet.split('')
const card_x_offset = 0;
const card_y_offset = 300;
const card_width = 50;
const card_height = 60;

// Page Const Value
const BLANK_EMPTY = '_'
const CARD_STATE = {
  UNUSED: 'card_unused',
  USED: 'card_used',
}
const cardObjectTemplate = {
  id: 0,
  letter: '',
  cardState: CARD_STATE.UNUSED,
  x: 0,
  y: 0,
  isUsed: false,
  blankValue: BLANK_EMPTY,
  usedCardIdx: false,
  usedBlankIdx: false,
  tempCardIdx: false,
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // Question Related
    alphabetArray: alphabetArray,
    questions: [],
    questionsDone: [],
    curQuestionIndex: 0,
    curQuestion: {},
    curSpellCards: [],
    selectedCard: null,

    // User Info related
    userInfo: null,

    // Time related
    timerInterval: 1000,
    curDeciSecond: 0,
    thinkSeconds: 0,
    questionWaitTime: 0,

    // Answer Related
    curAnswer: '',
    answerType: gConst.ANSWER_TYPE.DIGIT,
    isPause: false,
    pauseBtnText: '暂停',
    inputAnswerDisabled: false,
    fadeInOutQuestion: null,
    fadeInOutPauseBtn: null,
    isFavorited: false,

    // score related
    curScore: 0,
    totalScore: 0,
    historyRecord: {},
    userConfigs: utils.getUserConfigs(),

    // gConst
    gConst: gConst,

    // common
    tableName: '',
    tableValue: '',

    // page show
    questionViewWidth: 50,
    cardFontSize: 13.5,
    maxCardFontSize: 15,
    minCardFontSize: 5,

    // filters
    tags: [],
    lastDate: utils.getUserConfigs().filterQuesLastDate,
    lastTime: '00:00',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    debugLog('onLoad.options', options)
    let that = this
    let gameMode = options.gameMode;
    let tableValue = options.tableValue
    let tableName = options.tableName
    let tags = that.data.tags
    if (options.filterTags) {
      let filterTagsStr = options.filterTags;
      tags = tags.concat(filterTagsStr.split(','))
      debugLog('onLoad.tags', tags)
    }
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
      gameMode: gameMode,
      tags: tags,
      tableValue: tableValue,
      tableName: tableName,
      filterTags: options.filterTags,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this
    let userInfo = that.data.userInfo
    let gameMode = that.data.gameMode
    utils.getTotalScore(userInfo, userScore => {
      that.setData({
        totalScore: userScore.score,
      })
    })
    this.getQuestions(gameMode)
    this.resetAnswer()

    // 隐藏暂停按钮
    that.fadeInOut('fadeInOutPauseBtn', {
      duration: 10,
      timingFunction: 'ease-in',
      rotateY: 0,
      opacity: 0,
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
     * 提交做题记录
     */
  recordHistory: function (question, answer) {
    let that = this
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
  },

  /**
   * 暂停判断
   */
  checkPauseStatus: function () {
    let that = this
    if (that.data.isPause == true) {
      wx.showToast({
        image: gConst.ALERT_ICON,
        title: '点继续开始!',
        duration: 1000,
      })
      return true;
    } else {
      return false;
    }
  },

  /**
   * 组合拼写结果
   */
  combineSpellAnswer: function (spellAnswer) {
    if (spellAnswer && spellAnswer.length > 0) {
      let answerWord = spellAnswer.map(card => card.blankValue).join('')
      return answerWord;
    }
  },
  /**
   * 提交答案
   */
  submitAnswer: function (e) {
    if (this.checkPauseStatus()) {
      return;
    }

    
    // debugLog('submitAnswer.e', e)
    let that = this
    let dataset ;
    let answer
    let curQuestion = that.data.curQuestion
    let manualCheckResult
    let isCorrect = false
    try{
      dataset = e.target.dataset
      debugLog('submitAnswer.dataset', dataset)
      manualCheckResult = dataset.manualCheckResult
      for(let i in MANUAL_CHECK_RESULT){
        if (manualCheckResult == MANUAL_CHECK_RESULT[i].name){
          debugLog('MANUAL_CHECK_RESULT[i].value', MANUAL_CHECK_RESULT[i].value)
          if (MANUAL_CHECK_RESULT[i].value == true){
            debugLog('curQuestion.word', curQuestion.word)
            answer = curQuestion.word
          }
          break;
        }
      }
    }catch(e){errorLog('submitAnswer.e', e)}
    

    // try{

    // debugLog('formValues', formValues)
    
    // debugLog('curQuestion', curQuestion)
    // 同時針對回車和Button提交
    let curSpellCards = that.data.curSpellCards
    if (!manualCheckResult){
      answer = that.combineSpellAnswer(curSpellCards)
    }
    if (answer == curQuestion.word) {
      isCorrect = true
      wx.showToast({
        image: gConst.ANSWER_CORRECT,
        title: MSG.CORRECT_ALERT,
        duration: 500,
      }, function () {

      })
      let score = that.data.curQuestion.score ? that.data.curQuestion.score : 1
      that.setData({
        curScore: that.data.curScore + score,
        totalScore: that.data.totalScore + score,
      }, function (res) {
        wx.setStorageSync(storeKeys.totalScore, that.data.totalScore)
      })

    } else {
      wx.showToast({
        image: gConst.ANSWER_INCORRECT,
        title: MSG.INCORRECT_ALERT,
        duration: 500,
      })
    }
    // Record History
    let answerTime = new Date()
    that.recordHistory(curQuestion
      , {
        openid: that.data.userInfo.openId,
        nickName: that.data.userInfo.nickName,
        userRole: that.data.userInfo.userRole,
        answer: answer,
        isCorrect: isCorrect,
        answerTime: answerTime.getTime(),
        answerTimeStr: utils.formatDate(answerTime),
        // 减去一个计时间隔，作为操作时间
        thinkSeconds: that.data.thinkSeconds - that.data.timerInterval,
      })

    // Next Question
    common.onClickNextQuestion(that, null, isCorrect)
    that.setData({
      curAnswer: '',
      thinkSeconds: 0,
    })
    // }catch(e){
    //   errorLog('submitAnswer Error: ', e)
    // }
  },

  /**
   * 重置答案
   */
  resetAnswer: function (e) {
    let that = this
    if (that.checkPauseStatus()) {
      return;
    }

    
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
      questions: questions,
      questionsDone: questionsDone,
      curQuestionIndex: curQuestionIndex,
    })
    common.onClickNextQuestion(that, null, null, 0)


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
  },

  /**
   * 下一题
   */
  onClickNextQuestion: function (e, isCorrect, idxOffset) {
    let that = this
    common.onClickNextQuestion(that, e, isCorrect, idxOffset, res=>{

    })
  },

  /**
   * 处理当前题目
   * 7 cards in every line
   */
  processCurrentQuestion: function (question) {
    let that = this
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
        // debugLog('i', i)
        let cardObject = {}
        Object.assign(cardObject, cardObjectTemplate)
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
      that.setData({
        curSpellCards: curSpellCards,
        cardFontSize: cardFontSize,
      })
    }
  },

  /**
   * 获取所有题目
   */
  getQuestions: function (gameMode) {
    let that = this
    that.setData({
      questions: []
    })
    if (gameMode == gConst.GAME_MODE.NORMAL) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + titles[gConst.GAME_MODE.NORMAL]
      })
      common.getNormalQuestions(that, dataLoadTimer);

    } else if (gameMode == gConst.GAME_MODE.WRONG) {
      wx.setNavigationBarTitle({
        title: titles[gConst.GAME_MODE.WRONG]
      })
      this.getHistoryQuestions(gConst.GAME_MODE.WRONG);

    } else if (gameMode == gConst.GAME_MODE.FAVORITES) {
      wx.setNavigationBarTitle({
        title: titles[gConst.GAME_MODE.FAVORITES]
      })
      this.getFavoritesQuestions(gConst.GAME_MODE.FAVORITES);
    }
  },

  /**
   * 获得收藏题目
   */
  getFavoritesQuestions: function (mode) {
    let that = this
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
                  common.onClickNextQuestion(that, null, null, 0)
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
            clearInterval(dataLoadTimer)

          }
        })
        pageIdx++
    }, 1000)
    
  },

  /**
   * 获得做地错的题目
   */
  getHistoryQuestions: function (mode) {
    let that = this
    let userInfo = that.data.userInfo
    debugLog('that.data.lastDate', that.data.lastDate)
    debugLog('that.data.lastTime', that.data.lastTime)
    let filterDate = utils.mergeDateTime(that.data.lastDate, that.data.lastTime).getTime();
    debugLog('getWrongSlowQuestions.filterDate', filterDate)
    let wherefilters
    if (gConst.GAME_MODE.WRONG == mode) {
      wherefilters = _.and(
        {
          openid: userInfo.openId,
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
    learnHistoryApi.getHistoryQuestions(userInfo
      , wherefilters
      , res => {
        debugLog('spellEnglishWords.getHistoryQuestions[' + TABLES.LEARN_HISTORY + ']', res)
        try {
          if (res.list.length >= 0) {
            let questions = []
            for (let i in res.list) {
              questions.push(res.list[i]._id.question)
            }
            that.setData({
              questions: questions,
            }, function () {
              // 生成下一道题目
              common.onClickNextQuestion(that, null, null, 0)
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
  },

  /**
   * 暂停
   */
  onClickPause: function (e) {
    let that = this
    // 对于继续按钮做特殊处理，防止误触发
    if (e.target.dataset.isContinueButton
      && that.data.isPause == false) {
      return;
    }
    if (that.data.isPause) {
      that.setData({
        isPause: false,
        pauseBtnText: '暂停',
        inputAnswerDisabled: false,
      })
      that.fadeInOut('fadeInOutQuestion', {
        duration: 1000,
        timingFunction: 'ease-out',
        rotateY: 0,
        opacity: 1,
      });

      that.fadeInOut('fadeInOutPauseBtn', {
        duration: 1,
        timingFunction: 'ease-in',
        rotateY: 0,
        opacity: 0,
      })

    } else {
      that.setData({
        isPause: true,
        pauseBtnText: '继续',
        inputAnswerDisabled: true,
      })

      that.fadeInOut('fadeInOutQuestion', {
        duration: 1000,
        timingFunction: 'ease-in',
        rotateY: 180,
        opacity: 0,
      }, that.fadeInOut('fadeInOutPauseBtn', {
        duration: 1500,
        timingFunction: 'ease-out',
        rotateY: 0,
        opacity: 1,
      }));
    }
  },

  /**
   * Fade In Out Question
   */
  fadeInOut: function (animationName, fadeOptions, callback) {
    let that = this;
    let option = {
      duration: fadeOptions.duration, // 动画执行时间
      timingFunction: fadeOptions.timingFunction // 动画执行效果
    };
    var fadeInOut = wx.createAnimation(option)
    fadeInOut.rotateY(fadeOptions.rotateY);
    // moveOne.translateX('100vw');
    fadeInOut.opacity(fadeOptions.opacity).step();
    that.setData({
      [animationName]: fadeInOut.export(),// 开始执行动画
    }, function () {
      if (callback) {
        callback()
      };
    })
  },

  /**
   * 
   */
  bindLastDateChange: function (e) {
    let that = this
    debugLog('bindLastDateChange.e', e)
    let lastDate = e.detail.value;
    let lastTime = that.data.lastTime;
    let date = utils.mergeDateTime(lastDate, lastTime)
    that.setData({
      lastDate: lastDate,
      lastDateObj: date,
    })

  },

  /**
   * 
   */
  bindLastTimeChange: function (e) {
    let that = this
    debugLog('bindLastTimeChange.e', e)
    let lastDate = that.data.lastDate;
    let lastTime = e.detail.value;
    let date = utils.mergeDateTime(lastDate, lastTime)
    that.setData({
      lastTime: lastTime,
      lastDateObj: date,
    })

  },

  /**
   * Search questions with filter 
   * 
   */
  onClickSearch: function (e) {
    let that = this
    debugLog('search now...')
    that.getQuestions(that.data.gameMode);
    that.resetAnswer();
  },

  /**
   * 点击拼写空档
   */
  onTapSpellBlank: function (e) {
    let dataset = e.target.dataset;
    debugLog('onTapSpellBlank.dataset', dataset)
    let that = this

    let blankIdx = parseInt(dataset.blankIdx)
    debugLog('typeof blankIdx', typeof blankIdx)
    let selectedBlank = dataset.spellBlank
    let selectedCard = that.data.selectedCard
    let curSpellCards = that.data.curSpellCards;
    let curBlank = curSpellCards[blankIdx]

    if (selectedCard) {
      let usedCardIdx = selectedCard.tempCardIdx;
      curBlank.blankValue = selectedCard.letter
      curBlank.usedCardIdx = usedCardIdx;
      curSpellCards[curBlank.usedCardIdx].usedBlankIdx = blankIdx
      selectedCard = false

    } else {
      if (typeof curBlank.usedCardIdx == 'number') {
        // Mockup click spell card and call onTapAnswerCard
        this.onTapAnswerCard({
          target: {
            dataset: {
              cardIdx: curBlank.usedCardIdx,
              spellCard: curSpellCards[curBlank.usedCardIdx]
            }
          }
        })
      }

    }
    that.setData({
      selectedCard: selectedCard,
      curSpellCards: curSpellCards,
    })
  },

  /**
   * 点击字母卡片
   */
  onTapAnswerCard: function (e, callback) {
    let dataset = e.target.dataset;
    debugLog('onTapAnswerCard.dataset', dataset)
    let that = this
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
        curSpellCards[curCard.usedBlankIdx].usedCardIdx = false
        curCard.usedBlankIdx = false
      }
      selectedCard = false
    }
    // debugLog('selectCard', selectedCard)
    that.setData({
      curSpellCards: curSpellCards,
      selectedCard: selectedCard,
    })
    if (typeof callback == 'function') callback()
  },

  /**
   * 通过拖曳卡片填写答案
   * 自动填写到左起第一个空格上
   */
  onLongPressAnswerCard: function (e) {
    debugLog('onTouchMoveAnswerCard.e', e.target.dataset);
    let that = this
    let dataset = e.target.dataset
    let cardIdx = dataset.cardIdx
    let spellCard = dataset.spellCard
    if (spellCard.cardState == CARD_STATE.USED) {
      return;
    }
    that.onTapAnswerCard({
      target: {
        dataset: {
          cardIdx: cardIdx,
          spellCard: spellCard,
        }
      }
    }, res => {
      let blankIdx = false;
      let spellBlank = false
      let curSpellCards = that.data.curSpellCards;
      for (let i in curSpellCards) {
        if (curSpellCards[i].blankValue == BLANK_EMPTY) {
          spellBlank = curSpellCards[i]
          blankIdx = i
          that.onTapSpellBlank({
            target: {
              dataset: {
                blankIdx: blankIdx,
                spellBlank: spellBlank,
              }
            }
          })
          break;
        }
      }

    })
  },
  clickFavoriteSwitch: function (e) {
    let that = this
    debugLog('clickFavoriteSwitch.dataset', e.target.dataset)
    let dataset = e.target.dataset
    let curQuesId = dataset.curQuestionIndex

    if (that.data.isFavorited == true) {
      let curQuestion = that.data.curQuestion
      let tags = curQuestion.tags
      // delete favorite tag
      tags = tags.filter(ele => {
        return ele != gConst.IS_FAVORITED
      })
      debugLog('curQuestion tags removed', tags)
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
      debugLog('curQuestion tags', tags)
      favoritesApi.createFavorite(that.data.tableValue, curQuestion
        , res => {
          that.setData({
            isFavorited: true,
            curQuestion: curQuestion,
          })
        })

    }
  }
})