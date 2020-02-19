const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../../../const/message.js')
const debugLog = require('../../../utils/log.js').debug;
const errorLog = require('../../../utils/log.js').error;
const gConst = require('../../../const/global.js');
const storeKeys = require('../../../const/global.js').storageKeys;
const utils = require('../../../utils/util.js');
const animation = require('../../../utils/animation.js')
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

// 练习计时器
var scoreTimer = null;
var dataLoadTimer = null;


Page({

  /**
   * 页面的初始数据
   */
  data: {
    titleSubfix: '选择题',
    // Time related
    timerInterval: 1000,
    curDeciSecond: 0,
    thinkSeconds: 0,
    questionWaitTime: 0,
    
    // Question Related
    ANSWER_TYPES: gConst.ANSWER_TYPES.OPTIONS_SELECT,
    questions: [],
    questionsDone: [],
    curQuestionIndex: 0,
    curQuestion: {},
    curOptions: [],
    selectedOptions: [],

    // User Info related
    userInfo: null,

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
    // debugLog('onLoad.options', options)
    let that = this
    let gameMode = options.gameMode;
    let tableValue = options.tableValue
    let tableName = options.tableName
    let lastDate = (typeof options.lastDate == 'string' && options.lastDate != '') ? options.lastDate : that.data.lastDate
    let tags = [gConst.ANSWER_TYPES.OPTIONS_SELECT]
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
      selectedOptions: [],
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
        totalScore: userScore.score.toFixed(1),
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
   * 检查答案是否正确
   */
  checkAnswer: function (selectedOptions, answerOptions) {
    try{
      debugLog('checkAnswer.selectedOptions', selectedOptions)
      debugLog('checkAnswer.answerOptions', answerOptions)
      if (selectedOptions.length == answerOptions.length){
        for (let i in answerOptions){
          let found = selectedOptions.find(ele => ele.text == answerOptions[i])
          if (!found){
            // 因有不匹配的答案所以错误
            return false;
          }
        }
        return true
      }else{
        // 因为个数不一样所以错误
        return false
      }
    }catch(e){
      // 因为异常所以错误
      return false
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
    // try{

    // debugLog('formValues', formValues)

    // debugLog('curQuestion', curQuestion)
    // 同時針對回車和Button提交
    let answerOptions = that.data.curQuestion.answer
    let selectedOptions = that.data.selectedOptions
    isCorrect = that.checkAnswer(selectedOptions, answerOptions)
    // debugLog('isCorrect', isCorrect)

    that.setData({
      curAnswer: '',
      thinkSeconds: 0,
    })

    common.scoreApprove(that, curQuestion, isCorrect, () => {
      that.setData({
        curAnswer: '',
        thinkSeconds: 0,
      }, res => {
      })
    })
    // }catch(e){
    //   errorLog('submitAnswer Error: ', e)
    // }
  },

  /**
   * 关闭显示得分层
   */
  finishScoreApprove: function (e) {
    let that = this
    common.finishScoreApprove(that, e)
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
    debugLog('getQuestions.gameMode', gameMode)
    let that = this
    that.setData({
      questions: []
    })
    if (gameMode == gConst.GAME_MODE.NORMAL) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + that.data.titleSubfix
      })
      common.getNormalQuestions(that, dataLoadTimer);

    } else if (gameMode == gConst.GAME_MODE.WRONG) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + gConst.GAME_MODE.WRONG + that.data.titleSubfix
      })
      common.getHistoryQuestions(that, gConst.GAME_MODE.WRONG, dataLoadTimer);

    } else if (gameMode == gConst.GAME_MODE.FAVORITES) {
      wx.setNavigationBarTitle({
        title: that.data.tableName + gConst.GAME_MODE.FAVORITES + that.data.titleSubfix
      })
      common.getFavoritesQuestions(that, gConst.GAME_MODE.FAVORITES, dataLoadTimer);
    }
  },



  /**
   * 暂停
   */
  onClickPause: function (e) {
    let that = this
    // 对于继续按钮做特殊处理，防止误触发
    if (utils.getDataset(e).isContinueButton
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

  onTapReciteCard: function (e) {
    let that = this
    common.onTapReciteCard(that, e)
  },

  /**
   * 通过拖曳卡片填写答案
   * 自动填写到左起第一个空格上
   */
  onLongPressAnswerCard: function (e) {
    // debugLog('onLongPressAnswerCard.e', e.target.dataset);
    let that = this
    let dataset = utils.getDataset(e)
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
    let dataset = utils.getDataset(e)
    let curQuestionIndex = that.data.curQuestionIndex
    let clickCardIdx = dataset.cardIdx
    let idxOffSet = clickCardIdx - curQuestionIndex
    common.onClickNextQuestion(that, null, null, idxOffSet)

  },

  /**
   * tap Answer Option
   * 
   */
  tapSelectOption: function (e) {
    let that = this
    // debugLog('tapSelectOption.e', e)
    common.tapSelectOption(that, e)
  },

  /**
   * 对当前题目进行处理
   */
  processCurrentQuestion: function (that, nextQuestion) {
    common.processSelectOptions(that, nextQuestion)
  },

  /** 
   * 朗读当前卡片
   */
  playCardText: function (e) {
    let that = this
    common.readCurrentWord(that, that.data.curQuestion.questionText)
  }
})