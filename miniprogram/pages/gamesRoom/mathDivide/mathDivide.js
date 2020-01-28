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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    questions: [],
    curQuestionIndex: 0,
    curQuestion: {},
    userInfo: null,
    curScore: 0,
    totalScore: utils.getTotalScore(),
    curSeconds: 0,
    curAnswer: '',
    answerType: gConst.ANSWER_TYPE.DIGIT
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userInfo = utils.getUserInfo(globalData)
    this.setData({
      userInfo: userInfo,
      totalScore: utils.getTotalScore(),
    })
    this.getQuestions()
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
   * 提交答案
   */
  submitAnswer: function(e){
    let that = this
    let formValues = e.detail.value
    try{
      debugLog('formValues', formValues)
      let curQuestion = that.data.curQuestion
      debugLog('curQuestion', curQuestion)
      let answer = parseFloat(formValues.answer)
      if(answer == curQuestion.result){
        wx.showToast({
          image: gConst.ANSWER_CORRECT,
          title: '完全正确',
          duration: 500,
        }, function(){

        })
        that.setData({
          curScore: that.data.curScore + 1,
          totalScore: that.data.totalScore + 1,
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
      that.onClickNextQuestion()
      that.setData({
        curAnswer: '',
      })
    }catch(e){
      errorLog('submitAnswer Error: ', e)
    }
  },

  /**
   * 重置答案
   */
  resetAnswer: function(e){
    let that = this
    let formValues = e.detail.value
    // that.setData({
    //   curAnswer: ''
    // })
  },

  /**
   * 下一题
   */
  onClickNextQuestion: function(e){
    let that = this
    let targetValues = e?e.target.dataset:null

    let questions = this.data.questions
    let curQuestionIndex = Math.floor(Math.random() * questions.length)
    that.setData({
      curQuestionIndex: curQuestionIndex,
      curQuestion: questions[curQuestionIndex],
    })
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
        debugLog('queryDish.success.res', res)
        debugLog('queryDish.dishes.count', res.result.data.length)
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
})