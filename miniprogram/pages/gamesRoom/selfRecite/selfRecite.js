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
const userInfoUtils = require('../../../utils/userInfo.js')
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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    titleSubfix: '自助默写',
    // Question Related
    ANSWER_TYPES: gConst.ANSWER_TYPES.SELF_RECITE,
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
    userConfigs: userInfoUtils.getUserConfigs(),

    // 得分效果和历史记录用的
    hitsCount: 0,
    isShowPointLayer: false,
    hitsAccuScore: 0,
    curIsCorrect: false,
    curAnswer: false,

    // gConst
    gConst: gConst,

    // common
    tableName: '',
    tableValue: '',

    // page show
    questionViewWidth: 50,
    cardFontSize: 13.5,
    maxCardFontSize: 15,
    minCardFontSize: 8,

    // filters
    tags: [],
    lastDate: userInfoUtils.getUserConfigs().filterQuesLastDate,
    lastTime: '00:00',

    // Meaning Dialog
    isShownMeanDialog: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载字体
    utils.loadFonts()

 //   debugLog('selfRecite.options', options)
    let that = this
    that.initOnLoad(that, options);
    that.whenPageOnShow(that)
  },

  initOnLoad: function(that, options){
    // debugLog('initOnLoad.options', options)
    let gameMode = options.gameMode;
    let tableValue = options.tableValue
    let tableName = options.tableName
    let ebbingRateName = options.ebbingRateName
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
      ebbingRateName: ebbingRateName,
      options: options,
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
        totalScore: userScore.score.toFixed(1),
      })
    })
    common.getQuestions(that, that.data.gameMode, dataLoadTimer);
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
    // debugLog('submitAnswer.curQuestion', curQuestion)
    let manualCheckResult
    let isCorrect = false
    try {
      dataset = utils.getEventDataset(e)
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
    // 同時針對回車和Button提交
    let curSpellCards = that.data.curSpellCards
    if (!manualCheckResult) {
      answer = that.combineSpellAnswer(curSpellCards)
    }
    if (answer == curQuestion.word) {
      isCorrect = true
    }

    that.setData({
      curAnswer: answer?answer:null,
      curIsCorrect: isCorrect,
    })

    common.scoreApprove(that, curQuestion, isCorrect, ()=>{
      that.setData({
        curAnswer: '',
        thinkSeconds: 0,
      },res=>{
      })
    })
    // }catch(e){
    //   errorLog('submitAnswer Error: ', e)
    // }
  },

  /**
   * 关闭显示得分层
   */
  finishScoreApprove: function(e){
    let that = this
    common.finishScoreApprove(that, e)
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
         //   debugLog('用户点击确定')
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
   * 暂停
   */
  onClickPauseSwitch: function (e) {
    let that = this
    // 对于继续按钮做特殊处理，防止误触发
    if (utils.getEventDataset(e).isContinueButton
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

      animation.playFade(that, animation.MAP.FADE_IN_CONTINUE_BTN.name)

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
    }
  },


  /**
   *
   */
  bindLastDateChange: function (e) {
    let that = this
 //   debugLog('bindLastDateChange.e', e)
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
 //   debugLog('bindLastTimeChange.e', e)
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
 //   debugLog('search now...')
    common.getQuestions(that, that.data.gameMode, dataLoadTimer);
    that.resetAnswer();
  },

  onTapReciteCard: function (e) {
    let that = this
    // debugLog('onTapReciteCard.e', e)

    common.onTapReciteCard(that, e,
    (thats, curSpellCards, cardIdx)=>{
      // 当卡反过来的时候

    },
    (thats, curSpellCards, cardIdx) => {
      // 反一次卡，扣分1/n
      // let curQuestion = that.data.curQuestion
      // curQuestion.score = parseFloat((curQuestion.score - curQuestion.discount).toFixed(1))
      // debugLog('onTapReciteCard', curQuestion)
      // that.setData({
      //   curQuestion: curQuestion
      // })
      // 当卡没反过来的时候
          })
  },

  /**
   * 通过拖曳卡片填写答案
   * 自动填写到左起第一个空格上
   */
  onLongPressAnswerCard: function (e) {
    // debugLog('onLongPressAnswerCard.e', e.target.dataset);
    let that = this
    let dataset = utils.getEventDataset(e)
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
   * 朗读当前卡片
   */
  playCardText: function (e) {
    let that = this
    // 中英文间隔读
    that.playSwitch(that, (pThat, readContent, readLang)=>{
      common.readCurrentWord(pThat, readContent, readLang)
    })

  },

  /** 读一次英文，读一次中文 */
  playSwitch: function(that, callback){
    let readContent = that.data.readContent
    let readSwitch = that.data.readSwitch
    let readLang = null
 //   debugLog('readSwitch', readSwitch)
 //   debugLog('readContent', readContent)
 //   debugLog('that.data.tableValue.search(chinese)', that.data.tableValue.search('chinese'))
 //   debugLog('!readSwitch', !readSwitch
    if (!readSwitch
      || readSwitch == 'meaning'
      || that.data.tableValue.search('chinese') == 0){
   //   debugLog('read word')
      readContent = that.data.curQuestion.word
      readSwitch = 'word'
      readLang = null
    }else{
      // debugLog('read meaning')
      readContent = that.data.curQuestion.meaning.replace(/[a-z.\s]/gi,'')
      readSwitch = 'meaning'
      readLang = gConst.LANGS.CHINESE
    }
    that.setData({
      readContent: readContent,
      readSwitch: readSwitch
    }, ()=>{
      utils.runCallback(callback)(that, readContent, readLang)
    })
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
      // that.onTapReciteCard({
      //   target: {
      //     dataset:{
      //       spellCard: curSpellCards,
      //       cardIdx: i,
      //     }
      //   }
      // })
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
  },

  /**
   * 当点击剩下的单词卡片
   */
  onClickLeftCard: function (e) {
    let that = this
    let dataset = utils.getEventDataset(e)
    let curQuestionIndex = that.data.curQuestionIndex
    let clickCardIdx = dataset.cardIdx
    let idxOffSet = clickCardIdx - curQuestionIndex
    common.onClickNextQuestion(that, null, null, idxOffSet)

  },

  /**
   * 点击已经完成的卡片
   */
  onClickDoneCard: function (e) {
    let that = this
    let dataset = utils.getEventDataset(e)
    let clickCardIdx = dataset.cardIdx
    let clickDoneQuestion = that.data.questionsDone[clickCardIdx]
    let questions = that.data.questions
    // move done question to left questions
    questions.push(clickDoneQuestion)
    that.data.questionsDone.splice(clickCardIdx, 1)
    let nowCardIdx = questions.length - 1
    // mock up click left card
    that.onClickLeftCard({
      target: {
        dataset: {
          cardIdx: nowCardIdx,
          question: clickDoneQuestion,
        }
      }
    })
  },

  /**
   * 点击词典图标
   */
  openDictDialog: function (e) {
    let that = this
    let dictMode = gConst.DICT_SEARCH_MODE.WORD
    let dictSearchChar = null
    try {
      let dataset = utils.getEventDataset(e)
   //   debugLog('dataset.spellCard.letter', dataset.spellCard.letter)
      if (dataset.spellCard.letter.length > 0) {
        dictMode = gConst.DICT_SEARCH_MODE.CHAR
        dictSearchChar = dataset.spellCard.letter
      }
    } catch (e) { }
    if (that.data.tableValue.includes('chinese')) {
      that.setData({
        isShownMeanDialog: true,
        dictMode: dictMode,
        dictSearchChar: dictSearchChar,
      })
    } else if (that.data.tableValue.includes('english')) {
      that.setData({
        isShownMeanDialog: true,
        dictMode: dictMode,
        dictSearchChar: dictSearchChar,
      })
    } else {
      wx.showToast({
        title: MSG.FEATURE_IS_DISABLE,
      })
    }
  },

  /**
   * 关闭显示得分层
   */
  closeMeanDialog: function (params) {
    let that = this
    that.setData({
      isShownMeanDialog: false,
      dictMode: gConst.DICT_SEARCH_MODE.WORD,
      dictSearchChar: null,
    })
  }
})
