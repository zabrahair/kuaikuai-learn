const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../../../const/message.js')
const debugLog = require('../../../utils/log.js').debug;
const errorLog = require('../../../utils/log.js').error;
const gConst = require('../../../const/global.js');
const storeKeys = require('../../../const/global.js').storageKeys;
const utils = require('../../../utils/util.js');
const userInfoUtils = require('../../../utils/userInfo.js')
const animation = require('../../../utils/animation.js');
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
  usedCardIdx: null,
  usedBlankIdx: null,
  tempCardIdx: null,
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    titleSubfix: '拼写',
    // Question Related
    ANSWER_TYPES: gConst.ANSWER_TYPES.SPELLING,
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
    isFavorited: false,

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

    // page show
    questionViewWidth: 50,
    cardFontSize: 13.5,
    maxCardFontSize: 15,
    minCardFontSize: 6,

    // filters
    tags: ['拼写'],
    lastDate: userInfoUtils.getUserConfigs().filterQuesLastDate,
    lastTime: '00:00',
    filterTags: '',

    // Meaning Dialog
    isShownMeanDialog: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载字体
    utils.loadFonts()

    // debugLog('getCurrentPages()', getCurrentPages())
    // debugLog('onLoad.options', options)
    let that = this
    that.initOnLoad(that, options)
    that.whenPageOnShow(that)
  },

  initOnLoad: function(that, options){
    let gameMode = options.gameMode;
    let tags = []
    let tableValue = options.tableValue
    let tableName = options.tableName
    let lastDate = (typeof options.lastDate == 'string' && options.lastDate != '') ? options.lastDate : that.data.lastDate

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
    let that = this
    try{
      if (that.data.questions.length < 1 || that.checkPauseStatus()) {
        return;
      }
    }catch(e){}


    // try{

    // debugLog('formValues', formValues)
    let curQuestion = that.data.curQuestion
    // debugLog('curQuestion', curQuestion)
    // 同時針對回車和Button提交
    let curSpellCards = that.data.curSpellCards
    let answer = that.combineSpellAnswer(curSpellCards)
    // debugLog('answer', answer)
    let isCorrect = false
    if (answer == curQuestion.word) {
      isCorrect = true
    }

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
            // debugLog('用户点击确定')
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

  // /**
  //  * 获取所有题目
  //  */
  // getQuestions: function (gameMode) {
  //   let that = this

  //   if (gameMode == gConst.GAME_MODE.NORMAL) {
  //     wx.setNavigationBarTitle({
  //       title: that.data.tableName + that.data.titleSubfix
  //     })
  //     common.getNormalQuestions(that, dataLoadTimer)
  //     // this.getNormalQuestions(gConst.GAME_MODE.NORMAL);

  //   } else if (gameMode == gConst.GAME_MODE.WRONG) {
  //     wx.setNavigationBarTitle({
  //       title: that.data.tableName + that.data.titleSubfix
  //     })
  //     common.getHistoryQuestions(that, gConst.GAME_MODE.WRONG, dataLoadTimer );

  //   } else if (gameMode == gConst.GAME_MODE.FAVORITES) {
  //     wx.setNavigationBarTitle({
  //       title: that.data.tableName + that.data.titleSubfix
  //     })
  //     common.getFavoritesQuestions(that, gConst.GAME_MODE.FAVORITES, dataLoadTimer);
  //   }
  // },

  /**
   * 暂停
   */
  onClickPauseSwitch: function (e) {
    let that = this
    // 对于继续按钮做特殊处理，防止误触发
    if (utils.getEventDataset(e).isContinueButton
      && that.data.isPause == false){
      return;
    }
    if (that.data.isPause) {
      that.setData({
        isPause: false,
        pauseBtnText: '暂停',
        inputAnswerDisabled: false,
      })
      animation.playFade(that,
        animation.MAP.FADE_OUT_QUESTION_BLOCK.name,
        null,
        res=>{
          animation.playFade(that, animation.MAP.FADE_IN_CONTINUE_BTN.name)
      })


    } else {
      that.setData({
        isPause: true,
        pauseBtnText: '继续',
        inputAnswerDisabled: true,
      })

      animation.playFade(that, animation.MAP.FADE_IN_QUESTION_BLOCK.name,
        null,
        res => {
          animation.playFade(that, animation.MAP.FADE_OUT_CONTINUE_BTN.name)
        })
    }
  },

  /**
   *
   */
  bindLastDateChange: function (e) {
    let that = this
    // debugLog('bindLastDateChange.e', e)
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
    // debugLog('bindLastTimeChange.e', e)
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
    // debugLog('search now...')
    common.getQuestions(that, that.data.gameMode, dataLoadTimer);
    that.resetAnswer();
  },

  /**
   * 点击拼写空档
   */
  onTapSpellBlank: function(e){
    let dataset = utils.getEventDataset(e)
    // debugLog('onTapSpellBlank.dataset', dataset)
    let that = this

    let blankIdx = parseInt(dataset.blankIdx)
    // debugLog('typeof blankIdx', typeof blankIdx)
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

  onLongPressAnswerCard: function(e){
    let that = this
    common.onTapSpellCard(that, e)
  },

  /**
   * 通过拖曳卡片填写答案
   * 自动填写到左起第一个空格上
   */
   onTapSpellCard: function(e){
    // debugLog('onTapSpellCard.e', e);
    let that = this
    let dataset = utils.getEventDataset(e)
    let cardIdx = dataset.cardIdx
    let spellCard = dataset.spellCard
    if(spellCard.cardState == CARD_STATE.USED){
      this.onLongPressAnswerCard(e)
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
   * 对当前题目进行处理
   */
  processCurrentQuestion: function (that, nextQuestion) {
    common.processWordsIntoCards(that, nextQuestion)
  },

  /**
   * 朗读当前卡片
   */
  playCardText: function(e){
    let that = this
    common.readCurrentWord(that, that.data.curQuestion.word)
  },

  showOneMoreAnswer: function (e) {
    let that = this
    let corSpellArray = that.data.curQuestion.word.split('')
    let curSpellCards = that.data.curSpellCards

    for (let i in curSpellCards){
      // debugLog('showOneMoreAnswer.i:',i)
      // debugLog('curSpellCards[i].usedCardIdx', curSpellCards[i])
      // debugLog('that.data.curQuestion', that.data.curQuestion)
      if (curSpellCards[i].usedCardIdx == null){
        // debugLog('curSpellCards[i].blankValue == BLANK_EMPTY')
        // 填上一个正确答案，只添一个
        let rst = that.findCorrectCardAndClick(curSpellCards, corSpellArray[i])
        // 如果找不到正确的，说明已经被用了。找下一个。
        if (rst) {
          // 使用一次显示答案扣0.1分
          that.data.curQuestion.score = parseFloat(that.data.curQuestion.score) - parseFloat(that.data.curQuestion.discount)
          that.setData({
            curQuestion: that.data.curQuestion
          })
          return
        } else {
          continue
        }
      }else if (curSpellCards[i].blankValue != corSpellArray[i]){
        // debugLog('curSpellCards[i].blankValue != corSpellArray[i]')
        // 去掉一个错误答案
        that.onTapSpellBlank({
          target: {
            dataset: {
              spellBlank: curSpellCards[i],
              blankIdx: i
            }
          }
        })
        // 填上一个正确答案，只添一个
        let rst = that.findCorrectCardAndClick(curSpellCards, corSpellArray[i])
        // 如果找不到正确的，说明已经被用了。找下一个。
        if(rst){
          that.data.curQuestion.score = parseFloat(that.data.curQuestion.score) - parseFloat(that.data.curQuestion.discount)
          that.setData({
            curQuestion: that.data.curQuestion
          })
          return
        }else {
          continue
        }
      }
    }
  },

  findCorrectCardAndClick: function(curSpellCards, correctLetter){
    let that = this
    // 填上一个正确答案，只添一个
    // debugLog('findCorrectCardAndClick.correctLetter', correctLetter)
    for (let j in curSpellCards) {
      // debugLog('findCorrectCardAndClick.j:', j)
      // debugLog('findCorrectCardAndClick.curSpellCards[j]', curSpellCards[j])
      if (curSpellCards[j].letter == correctLetter
        && curSpellCards[j].usedBlankIdx == null) {
        that.onTapSpellCard({
          target: {
            dataset: {
              cardIdx: j,
              spellCard: curSpellCards[j]
            }
          }
        })

        return true
      }
    }
    return false
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
      // debugLog('dataset.spellCard.letter', dataset.spellCard.letter)
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
    } else if (that.data.tableValue.includes('english')){
      that.setData({
        isShownMeanDialog: true,
        dictMode: dictMode,
        dictSearchChar: dictSearchChar,
      })
    }else{
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
