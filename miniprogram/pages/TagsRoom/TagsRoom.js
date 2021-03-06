const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

const dbApi = require('../../api/db.js')
const common = require('../gamesRoom/common/common.js')
const configsApi = require('../../api/configs.js')

// init system configs
// utils.refreshConfigs(gConst.CONFIG_TAGS.ANSWER_TYPE)
// utils.refreshConfigs(gConst.CONFIG_TAGS.SYSTEM_CONFIG)

var dataLoadTimer;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isShowAllTags: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // debugLog('onLoad')
    let that = this
    common.initDataBodyInTagRoom(that, {
      tagsLocation: gConst.TAGS_LOCATION.NORMAL,
      gameMode: gConst.GAME_MODE.NORMAL,
    }, res=>{
      if (options.tagsLocation) {
        that.setData({
          tagsLocation: options.tagsLocation,
          options: options,
        })
      }
      if (options.answerType) {
        that.setData({
          selAnswerType: options.answerType
        })
      }
      common.initFilterAnswerTypes(that)
      common.initFilterTables(that, dataLoadTimer)
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
   * 当选择题目解答类型
   */
  selectAnswerType: function(e){
    let that = this
    let selIdx = e.detail.value
    // debugLog('selectAnswerType.e', e)
    // common.resetTagsPageSelected(that, ()=>{
      that.setData({
        selAnswerType: that.data.answerTypesPickers[selIdx],

      }, res => {
        common.getTags(that, that.data.selectedTable.value, dataLoadTimer)
      })
    // })
  },


  /**
   * 点击进入，切换到题目展示页
   */
  onClickEnter: function(e){
    let that = this
    common.onClickEnterInTagRoom(that, e)
  },


  /**
   * tap table
   *
  **/
  tapTable: function (e) {
    let that = this
    common.tapFilterTable(that, e, dataLoadTimer, res=>{
    })
  },

  /**
   * tap Tag
   * 
   */
  tapTag: function(e){
    let that = this
    common.tapTagInTagRoom(that, e, ()=>{
      common.getTags(that, that.data.selectedTable.value, dataLoadTimer)
    })
  },

  onKeywordSearch: function(e){
    let that = this
    // debugLog('onKeywordSearch.e', e)
    common.onKeywordSearch(that, e, dataLoadTimer)
  },

  /**
   * 显示所有标签
   */
  onShowAllTags: function(e){
    let that = this
    if(that.data.isShownAllTags){
      that.setData({
        isShownAllTags: false,
        showTagsBtnText: '显示所有标签'
      })
    }else{
      that.setData({
        isShownAllTags: true,
        showTagsBtnText: '隐藏标签'
      })
    }
  }
})