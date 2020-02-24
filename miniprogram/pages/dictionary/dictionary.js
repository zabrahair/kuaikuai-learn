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
const dictCommon = require('../../common/dictionary.js')
const configsApi = require('../../api/configs.js')

// init system configs
utils.refreshConfigs(gConst.CONFIG_TAGS.ANSWER_TYPE)
utils.refreshConfigs(gConst.CONFIG_TAGS.SYSTEM_CONFIG)

var dataLoadTimer;
var DICTIONARUY_LANG = [
  {
    name: "中文",
    value: 'chinese'
  },
  {
    name: '英语',
    value: 'english'
  },
]

Page({

  /**
   * 页面的初始数据
   */
  data: {
    langs: DICTIONARUY_LANG,
    selLang: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    dictCommon.initPage(that, options)
    // // 设置历史的性质
    // let tagsLocation = ""
    // let gameMode = ""
    // try {
    //   gameMode = options.gameMode
    //   if (gameMode == gConst.GAME_MODE.WRONG) {
    //     tagsLocation = gConst.TAGS_LOCATION.WRONG_HISTORY
    //   } else {
    //     tagsLocation = gConst.TAGS_LOCATION.HISTORY
    //   }
    // } catch (err) {
    //   tagsLocation = gConst.TAGS_LOCATION.WRONG_HISTORY
    //   gameMode = gConst.GAME_MODE.HISTORY
    // }
    // wx.setNavigationBarTitle({
    //   title: gameMode
    // })
    // common.initDataBodyInTagRoom(that, {
    //   tagsLocation: tagsLocation,
    //   gameMode: gameMode,
    // }, res => {
    //   if (options.tagsLocation) {
    //     that.setData({
    //       tagsLocation: options.tagsLocation
    //     })
    //   }
    //   if (options.answerType) {
    //     that.setData({
    //       selAnswerType: options.answerType
    //     })
    //   }
    //   common.initFilterAnswerTypes(that)
    //   common.initFilterTables(that, dataLoadTimer)
    // })
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
   * tap table
   *
  **/
  tapLang: function (e) {
    let that = this
    dictCommon.selectLang(that, e, (pThat)=>{

    })
  },


  /**
   * 当改变过滤关键字
   */
  onKeywordSearch: function (e) {
    let that = this
    dictCommon.setDictMode(that, e, (pThat)=>{
      dictCommon.launchSearchKeyword(that, e)
    })
    
    // debugLog('onKeywordSearch.e', e)
  }
})