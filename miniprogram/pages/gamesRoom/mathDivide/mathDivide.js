const app = getApp()
const globalData = app.globalData

const MSG = require('../../../const/message.js')
const debugLog = require('../../../utils/log.js').debug;
const errorLog = require('../../../utils/log.js').error;
const gConst = require('../../../const/global.js');
const storeKeys = require('../../../const/global.js').storageKeys;
const utils = require('../../../utils/util.js');
const TABLES = require('../../../const/collections.js')

const USER_ROLE = require('../../../const/userRole.js')
const dbApi = require('../../../api/db.js')
const userApi = require('../../../api/user.js')

// 练习计时器
var scoreTimer =  null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    questions: [],
    questionsDone: [],
    curQuestionIndex: 0,
    curQuestion: {},
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
    // score related
    
    curScore: 0,
    totalScore: 0,
    historyRecord: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
    })
    utils.getTotalScore(userInfo, userScore =>{
      that.setData({
        totalScore: userScore.score,
      })
    })
    this.getQuestions()
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
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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
    let historyRecord = {};
    question.tags.push(TABLES.MATH_DIVIDE)
    delete question._id
    Object.assign(historyRecord, question)
    Object.assign(historyRecord, answer)
    // debugLog('historyRecord', historyRecord)
    wx.cloud.callFunction({
      name: 'kuaiLearnHistoryCreate',
      data: {
        hisRecord: historyRecord
      },
      success: res => {
        // debugLog('kuaiLearnHistoryCreate.success.res', res)
      },
      fail: err => {
        errorLog('[云函数] 调用失败：', err)
      }
    })

  },

  /**
   * 暂停判断
   */
  checkPauseStatus: function(){
    let that = this
    if(that.data.isPause == true) {
      wx.showToast({
        image: gConst.ALERT_ICON,
        title: '点继续开始!',
        duration: 1000,
      })
      return true;
    }else{
      return false;
    }
  },

  /**
   * 提交答案
   */
  submitAnswer: function(e){
    if (this.checkPauseStatus()) {
      return;
    }

    // debugLog('submitAnswer.e', e)
    let that = this
    let formValues = e.detail.value
    // try{

      // debugLog('formValues', formValues)
      let curQuestion = that.data.curQuestion
      // debugLog('curQuestion', curQuestion)
      // 同時針對回車和Button提交
      let inputAnswer = formValues.answer ? formValues.answer : formValues
      let answer = parseFloat(inputAnswer)
      let isCorrect = false
      if(answer == curQuestion.result){
        isCorrect = true
        wx.showToast({
          image: gConst.ANSWER_CORRECT,
          title: '完全正确',
          duration: 500,
        }, function(){

        })
        let score = that.data.curQuestion.score ? that.data.curQuestion.score : 1
        that.setData({
          curScore: that.data.curScore + score,
          totalScore: that.data.totalScore + score,
        }, function(res){
          wx.setStorageSync(storeKeys.totalScore, that.data.totalScore)
        })
        
      }else{
        wx.showToast({
          image: gConst.ANSWER_INCORRECT,
          title: '继续努力',
          duration: 500,
        })
      }
      // Record History
    let answerTime = new Date()
      that.recordHistory(curQuestion
      , {
        openid: that.data.userInfo._openid,
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
      that.onClickNextQuestion(null, isCorrect)
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
  resetAnswer: function(e){
    if (this.checkPauseStatus()) {
      return;
    }

    let that = this
    let formValues = e ? e.detail.value : {}
    // Reset Questions
    let questions = this.data.questions
    let questionsDone = this.data.questionsDone
    let question = this.data.curQuestion
    let curQuestionIndex = this.data.curQuestionIndex
    for (let i in questionsDone) {
      questions.push(questionsDone[i])
    }
    questionsDone = []
    curQuestionIndex = Math.floor(Math.random() * questions.length)
    question = questions[curQuestionIndex]
    that.setData({
      questions: questions,
      questionsDone: questionsDone,
      curQuestionIndex: curQuestionIndex,
      curQuestion: question,
    })

    // debugLog('timer', utils.formatDeciTimer(1000*60*60*24*30*12))
    // 开始计时
    that.setData({
      curDeciSecond: 0,
      thinkSeconds: 0,
    })
    clearInterval(scoreTimer)
    scoreTimer = setInterval(function () {
      if (that.data.isPause == false){
        let timer = that.data.curDeciSecond + that.data.timerInterval
        let thinkTimer = that.data.thinkSeconds + that.data.timerInterval
        that.setData({
          curDeciSecond: timer,
          thinkSeconds: thinkTimer,
          curDeciTimerStr: utils.formatDeciTimer(timer, 1),
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
  onClickNextQuestion: function(e, isCorrect){
    if (this.checkPauseStatus()) {
      return;
    }
    try{
      let that = this
      let targetValues = e?e.target.dataset:null
      let questions = this.data.questions
      let questionsDone = this.data.questionsDone
      let question = this.data.curQuestion
      let curQuestionIndex = this.data.curQuestionIndex

      if (isCorrect) {
        questionsDone.push(question)
        questions.splice(curQuestionIndex, 1)
      }

      if (questions.length > 0){
        // If answer is correct then move to done.
        curQuestionIndex = Math.floor(Math.random() * questions.length)
        // debugLog('curQuestionIndex', curQuestionIndex)
        question = questions[curQuestionIndex]
        // debugLog('question', question)
      } else {
        for (let i in questionsDone){
          questions.push(questionsDone[i])
        }
        questionsDone = []
        curQuestionIndex = 0
        question = {}
      }
      that.setData({
        questions: questions,
        questionsDone: questionsDone,
        curQuestionIndex: curQuestionIndex,
        curQuestion: question,
        thinkSeconds: 0,
      })
    }catch(e){
      errorLog('onClickNextQuestion error:', e)
    }
  },

  /**
   * 获取所有题目
   */
  getQuestions: function(){
    let that = this
    let filters = {
      tags: '九九除法'
    }
    wx.cloud.callFunction({
      name: 'kuaiMathDivideQuery',
      data: {
        filters: filters
      },
      success: res => {
        // debugLog('kuaiMathDivideQuery.success.res', res)
        // debugLog('kuaiMathDivideQuery.questions.count', res.result.data.length)
        if (res.result.data.length && res.result.data.length > 0){
          let questions = res.result.data
          that.setData({
            questions: questions,
          },function () {
            // 生成下一道题目
            that.onClickNextQuestion()
          })
        }

      },
      fail: err => {
        console.error('[云函数] 调用失败：', err)
      }
    })
  },

  /**
   * 暂停
   */
  onClickPause: function(e){
    let that = this
    if (that.data.isPause){
      that.setData({
        isPause: false,
        pauseBtnText: '暂停',
        inputAnswerDisabled: false,
      })
      that.fadeInOut('fadeInOutQuestion',{
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

    }else{
      that.setData({
        isPause: true,
        pauseBtnText: '继续',
        inputAnswerDisabled: true,
      })

      that.fadeInOut('fadeInOutQuestion',{
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
   * When Input Answer
   */
  onInputAnswer: function(e){
    if (this.checkPauseStatus()) {
      return;
    }    
  },

  /**
   * Fade In Out Question
   */
  fadeInOut: function(animationName, fadeOptions, callback){
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
    }, function(){
      if(callback){
        callback()
      };
    })
  },



})