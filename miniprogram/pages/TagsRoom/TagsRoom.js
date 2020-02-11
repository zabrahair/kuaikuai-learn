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

const SELECTED_CSS = 'selected'
var dataLoadTimer;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // common
    isLoadingFinished: false,
    gConst: gConst,
    tables: [],
    selectedTable: '',
    tags: [],
    selectedTags: [],

    // Picker of answerTypes
    answerTypesObjects: [],
    answerTypesPickers: [],
    selAnswerType: '选择题型'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this

    that.initAnswerTypes()
    that.initTablesArray()

    
  },

  /**
   * 初始化题目类型
   */
  initAnswerTypes: function(){
    let that = this
    // Set Answer Types
    let answerTypesObjects = wx.getStorageSync(configsApi.ANSWER_TYPE)
    // debugLog('initAnswerTypes.answerTypesObjects', answerTypesObjects)
    let answerTypesPickers = utils.getArrFromObjectsArr(answerTypesObjects, 'name')
    // debugLog('initAnswerTypes.answerTypesPickers', answerTypesPickers)
    let selAnswerType = answerTypesPickers.length > 0 ? answerTypesPickers[0] : ''

    that.setData({
      answerTypesPickers: answerTypesPickers,
      answerTypesObjects: answerTypesObjects,
      selAnswerType: selAnswerType,
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

    that.setData({
      selAnswerType: that.data.answerTypesPickers[selIdx],
      tags: [],
    }, res=> {
      common.getTags(that, that.data.selectedTable.value, dataLoadTimer)
    })
  },

  /**
   * 初始化相关的表名
   */
  initTablesArray: function(callback){
    let that = this
    let tables = TABLES.LIST
    tables[0]['css'] = SELECTED_CSS
    that.setData({
      tables: tables,
      selectedTable: tables[0]
    }, res=>{
      common.getTags(that, that.data.selectedTable.value, dataLoadTimer);
    })
  },

  /**
   * 
   */
  onClickEnter: function(e){
    let that = this
    let selectedTags = that.data.selectedTags
    let joinedString = utils.arrayJoin(selectedTags, 'text')
    let url = ''
    if(that.data.selAnswerType == '默写卡'){
      url = '/pages/gamesRoom/words/words?gameMode=' + gConst.GAME_MODE.NORMAL + '&tableValue=' + that.data.selectedTable.value + '&tableName=' + that.data.selectedTable.name + '&filterTags=' + joinedString;
    } else if (that.data.selAnswerType == '拼写'){
      url = '/pages/gamesRoom/spell/spell?gameMode=' + gConst.GAME_MODE.NORMAL + '&tableValue=' + that.data.selectedTable.value + '&tableName=' + that.data.selectedTable.name + '&filterTags=' + joinedString;
    }
    wx.navigateTo({
      url: url
    })
  },


  /**
   * tap table
   *
  **/
  tapTable: function (e) {
    let that = this
    debugLog('tapTag.e.target.dataset', e.target.dataset)
    let dataset = e.target.dataset
    let tableValue = dataset.tableValue
    let tableIdx = parseInt(dataset.tableIdx)
    let selectedTable = that.data.selectedTable
    let tables = that.data.tables

    if (tableValue == selectedTable.value){
      return;
    }

    clearInterval(dataLoadTimer)
    for (let i in tables) {
      if (i == tableIdx){
        selectedTable = tables[i]
        tables[i]['css'] = SELECTED_CSS
        // common.getTags(that, tableValue, dataLoadTimer)
      }else{
        tables[i]['css'] = ''
      }
    }
    that.setData({
      tables: tables,
      selectedTable: selectedTable,
      tags: [],
      selectedTags: [],
    }, res=>{
      common.getTags(that, selectedTable.value, dataLoadTimer)
    })
  },

  /**
   * tap Tag
   * 
   */
  tapTag: function(e){
    let that = this
    // debugLog('tapTag.e.target.dataset', e.target.dataset)
    let dataset = e.target.dataset
    let tagText = dataset.tagText
    let tagIdx = parseInt(dataset.tagIdx)
    let tagCount = dataset.tagCount
    let selectedTags = that.data.selectedTags
    let tags = that.data.tags

    let isFound = false
    for (let i in selectedTags){
      if (selectedTags[i].text == tagText) {
        selectedTags.splice(i, 1)
        tags[tagIdx]['css'] = ''
        isFound = true
      }
    }

    if(isFound == false){
      tags[tagIdx]['css'] = SELECTED_CSS
      selectedTags.push(
        { 
          text: tagText,
          count: tagCount,
        }
      )
    }

    that.setData({
      selectedTags: selectedTags,
      tags: tags,
    })

  },
})