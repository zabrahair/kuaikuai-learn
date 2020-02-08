const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

const USER_ROLE = require('../../const/userRole.js')
const dbApi = require('../../api/db.js')
const ChineseWordsApi = require('../../api/ChineseWords.js')

const SELECTED_TAG_CSS = 'selected-tag'
var dataLoadTimer;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // common
    isLoadingFinished: false,
    gConst: gConst,
    tags: [],
    selectedTags: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getTags();
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
   * 
   */
  onClickEnter: function(e){
    let that = this
    let selectedTags = that.data.selectedTags
    let joinedString = utils.arrayJoin(selectedTags, 'text')
    wx.navigateTo({
      url: '/pages/gamesRoom/ChineseWords/ChineseWords?gameMode=' + gConst.GAME_MODE.NORMAL + '&filterTags=' + joinedString,
    })
  },
  /**
   * 獲取所有的標籤
   */
  getTags: function(){
    let that = this
    let pageIdx = 0
    clearInterval(dataLoadTimer)
    dataLoadTimer = setInterval(function () {
      ChineseWordsApi.getTags({}, pageIdx, (tags, pageIdx) => {
        debugLog('getTags.pageIdx', pageIdx)
        debugLog('getTags.tags', tags)
        if (!tags.length || tags.length < 1) {
          // stop load
          clearInterval(dataLoadTimer)
        }
        // 
        that.setData({
          tags: that.data.tags.concat(tags)
        })
      })
      pageIdx++;
    }, 500)
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
      tags[tagIdx]['css'] = SELECTED_TAG_CSS
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