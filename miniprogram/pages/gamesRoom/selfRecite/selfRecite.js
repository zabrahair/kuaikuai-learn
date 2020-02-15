const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../../../const/message.js')
const debugLog = require('../../../utils/log.js').debug;
const errorLog = require('../../../utils/log.js').error;
const gConst = require('../../../const/global.js');
const animation = require('../../../utils/animation.js');
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

const titleSubfix = '自助默写'

// // Alphabet Variables
// const alphabet = "abcdefghijklmnopqrstuvwxyz"
// const alphabetArray = alphabet.split('')
// const card_x_offset = 0;
// const card_y_offset = 300;
// const card_width = 50;
// const card_height = 60;

// // Page Const Value
// const BLANK_EMPTY = '_'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // Question Related
    ANSWER_TYPES: gConst.ANSWER_TYPES.MANUAL_CHECK,
    questions: [],
    questionsDone: [],
    curQuestionIndex: 0,
    curQuestion: {},
    curSpellCards: [],
    selectedCard: null,
    isRandomSpell: false,
    isAnswerVisible: false,

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
    isFavorited: false,

    // 画面效果
    fadeInOutQuestionBlock: null,
    fadeInOutContinueBtn: null,
    turnOverSpellCard: null,    

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
    debugLog('selfRecite.options', options)
    let that = this
    that.initOnLoad(that, options);
    that.whenPageOnShow(that)
  },

  initOnLoad: function(that, options){
    let gameMode = options.gameMode;
    let tableValue = options.tableValue
    let tableName = options.tableName
    let lastDate = (typeof options.lastDate == 'string' && options.lastDate != '') ? options.lastDate : that.data.lastDate
    let tags = []
    if (options.filterTags) {
      let filterTagsStr = options.filterTags;
      tags = tags.concat(filterTagsStr.split(','))
      // debugLog('onLoad.tags', tags)
    }
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
      gameMode: gameMode,
      tags: tags,
      tableValue: tableValue,
      tableName: tableName,
      filterTags: options.filterTags,
      lastDate: lastDate,
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
    
  },

  whenPageOnShow: function(that){
    let userInfo = that.data.userInfo
    let gameMode = that.data.gameMode
    utils.getTotalScore(userInfo, userScore => {
      that.setData({
        totalScore: userScore.score,
      })
    })
    that.getQuestions(gameMode)
    that.resetAnswer()

    // 隐藏暂停按钮
    animation.playFade(that, animation.MAP.FADE_IN_CONTINUE_BTN.name)

    // 将单词卡反过来
    if (that.data.isAnswerVisible){
      // animation.playFade(that, animation.MAP.TURN_OVER_SPELL_CARD.name)
    } 
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
   * 对当前题目进行处理
   */
  processCurrentQuestion: function (that, nextQuestion) {
    common.processWordsIntoCards(that, nextQuestion)
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
    let that = this
    try {
      if (that.data.questions.length < 1 || that.checkPauseStatus()) {
        return;
      }
    } catch (e) { }


    // debugLog('submitAnswer.e', e)
    let dataset;
    let answer
    let curQuestion = that.data.curQuestion
    let manualCheckResult
    let isCorrect = false
    try {
      dataset = e.target.dataset
      // debugLog('submitAnswer.dataset', dataset)
      manualCheckResult = dataset.manualCheckResult
      for (let i in MANUAL_CHECK_RESULT) {
        if (manualCheckResult == MANUAL_CHECK_RESULT[i].name) {
          // debugLog('MANUAL_CHECK_RESULT[i].value', MANUAL_CHECK_RESULT[i].value)
          if (MANUAL_CHECK_RESULT[i].value == true) {
            // debugLog('curQuestion.word', curQuestion.word)
            answer = curQuestion.word
          }
          break;
        }
      }
    } catch (e) { errorLog('submitAnswer.e', e) }


    // try{

    // debugLog('formValues', formValues)

    // debugLog('curQuestion', curQuestion)
    // 同時針對回車和Button提交
    let curSpellCards = that.data.curSpellCards
    if (!manualCheckResult) {
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
    // debugLog('resetAnswer.e', e)
    if (that.checkPauseStatus()) {
      return;
    }

    if (e && e.timeStamp) {
      wx.showModal({
        title: MSG.CONFIRM_TITLE,
        content: MSG.CONFIRM_RESET_MSG,
        success(res) {
          if (res.confirm) {
            debugLog('用户点击确定')
            common.resetQuestionStatus(that, e, scoreTimer)
          } else if (res.cancel) {
            errorLog('用户点击取消')
          }
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
        title: that.data.tableName + titleSubfix
      })
      common.getNormalQuestions(that, dataLoadTimer);

    } else if (gameMode == gConst.GAME_MODE.WRONG) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + gConst.GAME_MODE.WRONG + titleSubfix
      })
      common.getHistoryQuestions(that, gConst.GAME_MODE.WRONG, dataLoadTimer);

    } else if (gameMode == gConst.GAME_MODE.FAVORITES) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + gConst.GAME_MODE.FAVORITES + titleSubfix
      })
      common.getFavoritesQuestions(that, gConst.GAME_MODE.FAVORITES, dataLoadTimer);
    }
  },



  /**
   * 暂停
   */
  onClickPauseSwitch: function (e) {
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
      animation.playFade(that, animation.MAP.FADE_OUT_QUESTION_BLOCK.name)
      // that.fadeInOut('fadeInOutQuestion', {
      //   duration: 1000,
      //   timingFunction: 'ease-out',
      //   rotateY: 0,
      //   opacity: 1,
      // });

      animation.playFade(that, animation.MAP.FADE_IN_CONTINUE_BTN.name)
      // that.fadeInOut('fadeInOutPauseBtn', {
      //   duration: 1,
      //   timingFunction: 'ease-in',
      //   rotateY: 0,
      //   opacity: 0,
      // })
    } else {
      that.setData({
        isPause: true,
        pauseBtnText: '继续',
        inputAnswerDisabled: true,
      })

      animation.playFade(that, animation.MAP.FADE_IN_QUESTION_BLOCK.name, 
      null, 
      res=>{
        animation.playFade(that, animation.MAP.FADE_OUT_CONTINUE_BTN.name)
      })
      // that.fadeInOut('fadeInOutQuestion', {
      //   duration: 1000,
      //   timingFunction: 'ease-in',
      //   rotateY: 180,
      //   opacity: 0,
      // }, that.fadeInOut('fadeInOutPauseBtn', {
      //   duration: 1500,
      //   timingFunction: 'ease-out',
      //   rotateY: 0,
      //   opacity: 1,
      // }));
    }
  },

  // /**
  //  * Fade In Out Question
  //  */
  // fadeInOut: function (animationName, fadeOptions, callback) {
  //   let that = this;
  //   let option = {
  //     duration: fadeOptions.duration, // 动画执行时间
  //     timingFunction: fadeOptions.timingFunction // 动画执行效果
  //   };
  //   var fadeInOut = wx.createAnimation(option)
  //   fadeInOut.rotateY(fadeOptions.rotateY);
  //   // moveOne.translateX('100vw');
  //   fadeInOut.opacity(fadeOptions.opacity).step();
  //   that.setData({
  //     [animationName]: fadeInOut.export(),// 开始执行动画
  //   }, function () {
  //     if (callback) {
  //       callback()
  //     };
  //   })
  // },

 

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

  onTapReciteCard: function (e) {
    let that = this
    debugLog('onTapReciteCard.e', e)
    common.onTapReciteCard(that, e, 
    (thats, curSpellCards, cardIdx)=>{
      // 当卡反过来的时候
      // animation.playFade(that, animation.MAP.TURN_OVER_SPELL_CARD.name)
    }, 
    (thats, curSpellCards, cardIdx) => {
      // 当卡没反过来的时候
      // animation.playFade(that, animation.MAP.TURN_BACK_SPELL_CARD.name)
    })
  },

  /**
   * 通过拖曳卡片填写答案
   * 自动填写到左起第一个空格上
   */
  onLongPressAnswerCard: function (e) {
    // debugLog('onLongPressAnswerCard.e', e.target.dataset);
    let that = this
    let dataset = e.target.dataset
    let cardIdx = dataset.cardIdx
    let spellCard = dataset.spellCard
    if (spellCard.cardState == CARD_STATE.USED) {
      return;
    }

  },

  /**
   * 当点击收藏按钮
   */
  clickFavoriteSwitch: function (e) {
    let that = this
    common.clickFavoriteSwitch(that, e)
  },

  /**
   * 当点击剩下的单词卡片
   */
  onClickLeftCard: function (e) {
    let that = this
    let dataset = e.target.dataset
    let curQuestionIndex = that.data.curQuestionIndex
    let clickCardIdx = dataset.cardIdx
    let idxOffSet = clickCardIdx - curQuestionIndex
    common.onClickNextQuestion(that, null, null, idxOffSet)

  },

  /** 
   * 朗读当前卡片
   */
  playCardText: function (e) {
    let that = this
    common.readCurrentWord(that, that.data.curQuestion.word)
  },

  switchAnswerVisibility: function(e){
    let that = this
    // try{
      that.setData({
        isAnswerVisible: (that.data.isAnswerVisible == false) ? true : false,
      }, res=>{
        that.setAnswerShownState(that)
      })
    // } catch (e) { errorLog('switchAnswerVisibility', switchAnswerVisibility)}
  },

  setAnswerShownState: function(that){
    let curSpellCards = that.data.curSpellCards
    for (let i in curSpellCards) {
      if (that.data.isAnswerVisible){
        curSpellCards[i].cardState = common.CARD_STATE.UNUSED
      }else{
        curSpellCards[i].cardState = common.CARD_STATE.USED
      }
    }
    that.setData({
      curSpellCards: curSpellCards
    })
  },

  /**
   * 当前页面在切换题目的时候做的个性事情
   */
  myNextQuestionActions: function (that, nextQuestion){
    that.setData({
      isAnswerVisible: false,
    }, res=>{
      that.setAnswerShownState(that)
    })
  }

})