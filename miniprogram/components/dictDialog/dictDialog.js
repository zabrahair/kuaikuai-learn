const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')
const animation = require('../../utils/animation.js');
const dialogCommon = require('../../common/dialog.js')

const dbApi = require('../../api/db.js')
const common = require('../../pages/gamesRoom/common/common.js')

//db
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command
const ON_LOADING_TIMEOUT = 10000
Component({
  /**
   * 组件的属性列表
   */
  properties: dialogCommon.defaultDialogProperties({
    table: {
      type: String,
      value: '',
    },
    word: {
      type: String,
      value: '',
    },
    char: {
      type: String,
      value: null,
    },
    dictMode: {
      type: String,
      value: gConst.DICT_SEARCH_MODE.WORD,
    },
  }),

  /**
   * 组件的初始数据
   */
  data: dialogCommon.defaultDialogData({
    meaning: '',
  }),

  lifetimes: {
    attached: function(){
      let that = this
      dialogCommon.initDialog(that)
    },
    show: function(){
   //   debugLog('dictDialog.lifetimes.show')
    }
  },
  pageLifetimes: {
    show: function () {
      // debugLog('getPoint.pageLifetimes.show')
    }
  },
  observers: {
    'isShown, table, dictMode, word, char': function (isShown, table, dictMode, word, char) {
      let that = this
      // debugLog('observers.dictMode', dictMode)
      // debugLog('observers.dictMode', table)
      if(isShown == true){
        dialogCommon.whenIsShown(that)
        wx.showLoading({
          title: MSG.ON_LOADING,
        })
        setTimeout(res => {
          wx.hideLoading()
        }, ON_LOADING_TIMEOUT)
        if (dictMode == gConst.DICT_SEARCH_MODE.WORD){
          // debugLog('observers.word', word)
          that.getWordMeaning(that, table, word, res=>{
            // debugLog('getWordMeaning.res', res)
            if(!res){
              // debugLog('getWordMeaning.search.from.web', )
              if (table.includes('chinese')) {
                that.searchCnWordMeaning(that, word);
              } else if (table.includes('english')) {
                that.searchEnMeaning(that, word);
              }
            }

          })


        } else if (dictMode == gConst.DICT_SEARCH_MODE.CHAR && char != null && char.length > 0){
          // debugLog('observers.char', char)
          that.searchCharMeaning(that, char);
        }

      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取单词解释
     */
    searchCnWordMeaning(that, word){
      // let regex = new RegExp('data-type-block="词语解释"[^>]+?>(?:.+?)(<div class="content definitions".+?)(?:<div class="div copyright">)', 'gi')
      let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(?:<div class="zdict">[^<]+?<div class="dictentry">[^<]+?<div class="nr-box nr-box-shiyi wytl" data-type-block="网友讨论")', 'gi')
      that.searchCnMeaning(that, regex, word)
    },

    /**
     * 获取字的解释
     */
    searchCharMeaning(that, char) {
      let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(?:<div class="zdict">[^<]+?<div class="dictentry">[^<]+?<div class="nr-box nr-box-shiyi wytl" data-type-block="网友讨论")', 'gi')
      that.searchCnMeaning(that, regex, char)
    },
    /**
     * 获取中文单词/字解释
     */
    searchCnMeaning(that, regex, content){
      that.setData({
        meaning: ''
      })
      const MEANING_URI_PREFIX = 'https://www.zdic.net/hans/'
      let uri = MEANING_URI_PREFIX + content
      let timeout = 10000
      wx.request({
        method: 'GET',
        timeout: 10000,
        url: uri,
        success: (res, res2) => {

          let context = res.data.replace(/(\r|\n|\t)/gi, '')
          let rst = regex.exec(context)
          // debugLog('request.success.rst', rst)
          try{
            let meaning = rst[1]
            meaning = meaning.replace(/\[[^<>]+?\]/gi, '')
            meaning = meaning.replace(/<script.+?<\/script>/gi, '')
            meaning = meaning.replace(/<div class="div copyright"> © 汉典 <\/div>/gi, '')
            meaning = meaning.replace(/<ins.+?<\/ins>/gi, '<br/>')
            meaning = meaning.replace(/<a[^>]+?>/gi, '')
            meaning = meaning.replace(/<\/a>/gi, '')
            if (!meaning || meaning.trim() == '') {
              wx.showToast({
                title: MSG.NO_MEANING,
                duration: 1500,
                complete: res=>{
                  throw new Error("meaning is empty")
                },
              })

            }

            // debugLog('meaning', meaning)
            that.setData({
              meaning: meaning
            }, res => {
              if(that.data.dictMode == gConst.DICT_SEARCH_MODE.WORD){
                that.updateWordMeaning(that, that.data.table, that.data.word, that.data.meaning)
              }
              wx.hideLoading()
            })
          } catch (e) {
            that.setData({
              meaning: '',
            })
            that.onClose()
          }

        },
        fail: (res, res2) => {
       //   debugLog('request.fail.res', res)
        },
        complete: (res) => {
          // debugLog('request.complete.res', res)
        }
      })
    },

    /**
    * 获取英语单词/字解释
    */
    searchEnMeaning(that, content) {
      that.setData({
        meaning: ''
      })
      const MEANING_URI_PREFIX = 'https://dictionary.cambridge.org/zhs/词典/英语-汉语-简体/'
      let uri = MEANING_URI_PREFIX + content
   //   debugLog('searchEnMeaning.uri', uri)
      let timeout = 10000
      wx.request({
        method: 'GET',
        timeout: 10000,
        url: uri,
        success: (res, res2) => {

          let context = res.data.replace(/(\r|\n|\t)/gi, '')
          // let context = data.replace(/\n/gi, '')
          let regex = new RegExp('(<div class="di-body">.+?)(?:<small)','gi')
          // debugLog('request.success.context', context)
          let rst = regex.exec(context)
          // debugLog('request.success.rst', rst)
          try {

            let meaning = rst[1]
              meaning = meaning.replace(/<source.+?\/>/gi, '')
              meaning = meaning.replace(/<amp-audio.+?>.+?<\/amp-audio>/gi, '')
              meaning = meaning.replace(/<script.+?<\/script>/gi, '')
              meaning = meaning.replace(/<a.+?<\/a>/gi, '')
            // meaning = meaning.replace(/<\/a>/gi, '')
              if(!meaning || meaning.trim() == ''){
                wx.showToast({
                  title: MSG.NO_MEANING,
                  duration: 1500,
                  complete: res => {
                    throw new Error("meaning is empty")
                  },
                })
              }


            // debugLog('meaning', meaning)
            that.setData({
              meaning: meaning
            }, res=>{
              if (that.data.dictMode == gConst.DICT_SEARCH_MODE.WORD) {
                that.updateWordMeaning(that, that.data.table, that.data.word, that.data.meaning)
              }
              wx.hideLoading()
            })
          } catch (e) {
            that.setData({
              meaning: '',
            })
            that.onClose()
          }

        },
        fail: (res, res2) => {
       //   debugLog('request.fail.res', res)
        },
        complete: (res) => {
          // debugLog('request.complete.res', res)
        }
      })
    },
    /**
     * 关闭对话框
     */
    onClose: dialogCommon.onClose,
    // function (e) {
    //   let that = this
    //   animation.playSwitchDialog(
    //     that,
    //     animation.MAP.CLOSE_DIALOG.name,
    //     {},
    //     ()=>{
    //       that.setData({
    //         isShown: false
    //       }, res => {
    //         that.triggerEvent('close')
    //       })
    //   })
    // },
    /**
     * 朗读当前卡片
     */
    playCardText: function (e) {
      let that = this
      // let meaning = that.data.meaning
      // meaning = meaning.replace(/<[^>]+?>/gi,'')
      // meaning = meaning.replace(/\s/gi, '')
      // meaning = meaning.replace(/&[^;]+?;/gi, '')
      // meaning = meaning.replace(/[a-z]/gi, '')

      // debugLog('playCardText.meaning', meaning)
      common.readCurrentWord(that, that.data.dictMode == gConst.DICT_SEARCH_MODE.WORD ? that.data.word : that.data.char)
    },
    /**
     * 更新单词的解释
     */
    updateWordMeaning: function(that, table, word, meaning){
   //   debugLog('updateWordMeaning.run...')
      wx.cloud.callFunction({
        name: 'Update',
        data: {
          table: table,
          where: {
            word: word
          },
          update: {
            htmlMeaning: meaning
          }
        },
        success: res=>{
          // debugLog('updateWordMeaning.res', res)
        },
        fail: err=>{
          errorLog('updateWordMeaning.err', err)
        }
      })
    },
    /**
     * 获取单词解释
     */
    getWordMeaning: function(that, table, word, callback){
   //   debugLog('getWordMeaning.run...')
      wx.cloud.callFunction({
        name: 'Query',
        data: {
          table: table,
          where: {
            word: word,
          },
          limit: 1,
          pageIdx: 0,
          field: {
            word: true,
            htmlMeaning: true,
          }
        },
        success: res => {
          wx.hideLoading()
       //   debugLog('getWordMeaning.res', res)
          try{
            let list = res.result.data
            if (list && list.length > 0 && list[0].htmlMeaning.length > 0) {
              callback(list[0])
            } else {
              callback(null)
            }
            that.setData({
              meaning: list[0].htmlMeaning
            })
          }catch(err){
            callback(null)
          }

        },
        fail: err => {
          errorLog('getWordMeaning.err', err)
        }
      })
    }
  }
})
