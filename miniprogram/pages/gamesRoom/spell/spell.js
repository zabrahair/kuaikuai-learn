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
const common = require('../common/common.js')

// Api Handler
const dbApi = require('../../../api/db.js')
const userApi = require('../../../api/user.js')
const learnHistoryApi = require('../../../api/learnHistory.js')
const favoritesApi = require('../../../api/favorites.js')

// DB Related
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

// 练习计时器
var scoreTimer = null;
var dataLoadTimer = null;

const titles = {
}
const titleSubfix = '拼写'

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
    isRandomSpell: true,

    // User Info related
    userInfo: null,

    // Time related
    timerInterval: 1000,
    curDeciSecond: 0,
    thinkSeconds: 0,

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

    // filters
    tags: ['拼写'],
    lastDate: utils.getUserConfigs().filterQuesLastDate,
    lastTime: '00:00',
    filterTags: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // debugLog('getCurrentPages()', getCurrentPages())
    debugLog('onLoad.options', options)
    let that = this
    let gameMode = options.gameMode;
    let tags = []
    let tableValue = options.tableValue
    let tableName = options.tableName
    let lastDate = (typeof options.lastDate == 'string' && options.lastDate != '') ? options.lastDate : that.data.lastDate

    if (options.filterTags){
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
      lastDate: lastDate,
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
  combineSpellAnswer: function(spellAnswer){
    if (spellAnswer && spellAnswer.length > 0){
      let answerWord = spellAnswer.map(card=> card.blankValue).join('')
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

    // try{

    // debugLog('formValues', formValues)
    let curQuestion = that.data.curQuestion
    // debugLog('curQuestion', curQuestion)
    // 同時針對回車和Button提交
    let curSpellCards = that.data.curSpellCards
    let answer = that.combineSpellAnswer(curSpellCards)
    debugLog('answer', answer)
    let isCorrect = false
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
    common.recordHistory(that, curQuestion
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
    common.onClickNextQuestion(that, null, isCorrect, 0)
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
    debugLog('resetAnswer.e', e)
    if (that.checkPauseStatus()) {
      return;
    }

    if (e && e.timeStamp) {
      wx.showModal({
        title: MSG.CONFIRM_TITLE,
        content: MSG.CONFIRM_RESET_MSG,
        success(res) {
          common.resetQuestionStatus(that, e, scoreTimer)
        }
      })
    } else {
      common.resetQuestionStatus(that, e, scoreTimer)
    }
  },

  /**
 * 下一题
 */
  onClickNextQuestion: function (e, isCorrect, idxOffset) {
    let that = this
    common.onClickNextQuestion(that, e, isCorrect, idxOffset, res => {

    })
  },

  // /**
  //  * 下一题
  //  */
  // onClickNextQuestion: function (e, isCorrect) {
  //   let that = this
  //   if (that.checkPauseStatus()) {
  //     return;
  //   }
  //   try {
  //     let targetValues = e ? e.target.dataset : null
  //     let questions = this.data.questions
  //     let questionsDone = this.data.questionsDone
  //     let question = this.data.curQuestion
  //     let curQuestionIndex = this.data.curQuestionIndex

  //     if (isCorrect) {
  //       questionsDone.push(question)
  //       questions.splice(curQuestionIndex, 1)
  //     }

  //     if (questions.length > 0) {
  //       // If answer is correct then move to done.
  //       curQuestionIndex = Math.floor(Math.random() * questions.length)
  //       // debugLog('curQuestionIndex', curQuestionIndex)
  //       question = questions[curQuestionIndex]
  //       // debugLog('question', question)
  //     } else {
  //       for (let i in questionsDone) {
  //         questions.push(questionsDone[i])
  //       }
  //       questionsDone = []
  //       curQuestionIndex = 0
  //       question = {}
  //       wx.showToast({
  //         image: gConst.ANSWER_CORRECT,
  //         title: MSG.FINISH_ALL_QUESTIONS,
  //         duration: 1000,
  //       }, function () {

  //       })
  //     }

  //     let isFavorited = false
  //     if (question._id) {
  //       let tags = question.tags
        
  //       if (tags.includes(gConst.IS_FAVORITED)) {
  //         isFavorited = true
  //       }
  //     }

  //     // 重置变量
  //     that.setData({
  //       questions: questions,
  //       questionsDone: questionsDone,
  //       curQuestionIndex: curQuestionIndex,
  //       curQuestion: question,
  //       curAnswer: '',
  //       selectedCard: false,
  //       curSpellCards: false,
  //       thinkSeconds: 0,
  //       isFavorited: isFavorited,
  //     }, res=>{
  //       that.processCurrentQuestion(question)
  //     })
  //   } catch (e) {
  //     errorLog('onClickNextQuestion error:', e)
  //   }
  // },

  /**
   * 获取所有题目
   */
  getQuestions: function (gameMode) {
    let that = this

    if (gameMode == gConst.GAME_MODE.NORMAL) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + titleSubfix
      })
      common.getNormalQuestions(that, dataLoadTimer)
      // this.getNormalQuestions(gConst.GAME_MODE.NORMAL);

    } else if (gameMode == gConst.GAME_MODE.WRONG) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + titleSubfix
      })
      common.getHistoryQuestions(that, gConst.GAME_MODE.WRONG, dataLoadTimer );

    } else if (gameMode == gConst.GAME_MODE.FAVORITES) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + titleSubfix
      })
      common.getFavoritesQuestions(that, gConst.GAME_MODE.FAVORITES, dataLoadTimer);
    }
  },

  // /**
  //  * 获得收藏题目
  //  */
  // getFavoritesQuestions: function(mode){
  //   let that = this
  //   let userInfo = that.data.userInfo
  //   debugLog('that.data.lastDate', that.data.lastDate)
  //   debugLog('that.data.lastTime', that.data.lastTime)
  //   let filterDate = utils.mergeDateTime(that.data.lastDate, that.data.lastTime).getTime();
  //   debugLog('getFavoritesQuestions.filterDate', filterDate)
  //   let wherefilters
  //   if (gConst.GAME_MODE.FAVORITES == mode) {
  //     wherefilters = {
  //       tags: _.all(that.data.tags)
  //     }
  //   }
  //   favoritesApi.getFavorites(that.data.tableValue
  //     , wherefilters
  //     , res => {
  //       debugLog('favoritesApi.getFavorites', res)
  //       try {
  //         if (res.length >= 0) {
  //           let questions = []
  //           for (let i in res) {
  //             questions.push(res[i].thing)
  //           }
  //           that.setData({
  //             questions: questions,
  //           }, function () {
  //             // 生成下一道题目
  //             common.onClickNextQuestion(that, null, null, 0)
  //           })
  //         }
  //       } catch (e) {
  //         wx.showToast({
  //           image: gConst.ERROR_ICON,
  //           title: MSG.SOME_EXCEPTION,
  //           duration: 1000,
  //         })
  //       }

  //     })
  // },

  // /**
  //  * 获得做地错的题目
  //  */
  // getHistoryQuestions: function (mode) {
  //   let that = this
  //   let userInfo = that.data.userInfo
  //   debugLog('that.data.lastDate', that.data.lastDate)
  //   debugLog('that.data.lastTime', that.data.lastTime)
  //   let filterDate = utils.mergeDateTime(that.data.lastDate, that.data.lastTime).getTime();
  //   debugLog('getWrongSlowQuestions.filterDate', filterDate)
  //   let wherefilters
  //   if(gConst.GAME_MODE.WRONG == mode ){
  //     wherefilters = _.and(
  //       {
  //         openid: userInfo.openId,
  //         table: that.data.tableValue,
  //         question: _.exists(true),
  //         answerTime: _.gte(filterDate),
  //         question: {
  //           tags: _.all(that.data.tags)
  //         }
  //       },
  //       _.or([{ isCorrect: false },
  //         // { thinkSeconds: _.gt('$question.minFinishTime') }
  //       ]))
  //   }
  //   learnHistoryApi.getHistoryQuestions(userInfo
  //     , wherefilters
  //     , res => {
  //       debugLog('spellEnglishWords.getHistoryQuestions[' + TABLES.LEARN_HISTORY + ']', res)
  //       try {
  //         if (res.list.length >= 0) {
  //           let questions = []
  //           for (let i in res.list) {
  //             questions.push(res.list[i]._id.question)
  //           }
  //           that.setData({
  //             questions: questions,
  //           }, function () {
  //             // 生成下一道题目
  //             common.onClickNextQuestion(that, null, null, 0)
  //           })
  //         }
  //       } catch (e) {
  //         wx.showToast({
  //           image: gConst.ERROR_ICON,
  //           title: MSG.SOME_EXCEPTION,
  //           duration: 1000,
  //         })
  //       }

  //     })
  // },

  /**
   * 暂停
   */
  onClickPause: function (e) {
    let that = this
    // 对于继续按钮做特殊处理，防止误触发
    if (e.target.dataset.isContinueButton 
      && that.data.isPause == false){
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
  onTapSpellBlank: function(e){
    let dataset = e.target.dataset;
    debugLog('onTapSpellBlank.dataset', dataset)
    let that = this
    
    let blankIdx = parseInt(dataset.blankIdx)
    debugLog('typeof blankIdx', typeof blankIdx)
    let selectedBlank = dataset.spellBlank
    let selectedCard = that.data.selectedCard
    let curSpellCards = that.data.curSpellCards;
    let curBlank = curSpellCards[blankIdx]

    if (selectedCard){
      let usedCardIdx = selectedCard.tempCardIdx;
      curBlank.blankValue = selectedCard.letter
      curBlank.usedCardIdx = usedCardIdx;
      curSpellCards[curBlank.usedCardIdx].usedBlankIdx = blankIdx
      selectedCard = false

    }else{
      if (typeof curBlank.usedCardIdx == 'number'){
        // Mockup click spell card and call onTapSpellCard
        common.onTapSpellCard(that, {
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

  onTapSpellCard: function(e){
    let that = this
    common.onTapSpellCard(that, e)
  },

  /**
   * 通过拖曳卡片填写答案
   * 自动填写到左起第一个空格上
   */
  onLongPressAnswerCard: function(e){
    debugLog('onTouchMoveAnswerCard.e', e.target.dataset);
    let that = this
    let dataset = e.target.dataset
    let cardIdx = dataset.cardIdx
    let spellCard = dataset.spellCard
    if(spellCard.cardState == CARD_STATE.USED){
      return;
    }
    common.onTapSpellCard(that, {
      target: {
        dataset: {
          cardIdx: cardIdx,
          spellCard: spellCard,          
        }
      }
    }, res=>{
      let blankIdx = false;
      let spellBlank = false
      let curSpellCards = that.data.curSpellCards;
      for (let i in curSpellCards){
        if (curSpellCards[i].blankValue == BLANK_EMPTY){
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
  
  /**
   * 当点击收藏按钮
   */
  clickFavoriteSwitch: function(e){
    let that = this
    common.clickFavoriteSwitch(that, e)
  }
})