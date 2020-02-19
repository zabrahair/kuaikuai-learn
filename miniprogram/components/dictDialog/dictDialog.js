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

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShown: {
      type: Boolean,
      value: false,
    },
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
  },

  /**
   * 组件的初始数据
   */
  data: {
    meaning: '',
  },
  observers: {
    'isShown, table, dictMode, word, char': function (isShown, table, dictMode, word, char) {
      let that = this
      debugLog('observers.dictMode', dictMode)
      debugLog('observers.dictMode', table)
      if(isShown == true){
        if (dictMode == gConst.DICT_SEARCH_MODE.WORD){
          debugLog('observers.word', word)
          if(table.includes('chinese')){
            that.searchCnWordMeaning(that, word);
          } else if (table.includes('english')){
            that.searchEnMeaning(that, word);
          }
          
        } else if (dictMode == gConst.DICT_SEARCH_MODE.CHAR && char != null && char.length > 0){
          debugLog('observers.char', char)
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
      let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(data-type-block="网友讨论")', 'gi')
      that.searchCnMeaning(that, regex, word)
    },

    /**
     * 获取字的解释
     */
    searchCharMeaning(that, char) {
      let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(?:data-type-block="网友讨论")', 'gi')
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
            let meaning = rst[1] + '></div></div></div>'
            
            meaning = meaning.replace(/\[[^<>]+?\]/gi, '')
            meaning = meaning.replace(/<script.+?<\/script>/gi,'')
            // debugLog('meaning', meaning)
            that.setData({
              meaning: meaning
            })
          }catch(e){}

        },
        fail: (res, res2) => {
          debugLog('request.fail.res', res)
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
      debugLog('searchEnMeaning.uri', uri)
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

            let meaning = rst[1] + ''
            meaning = meaning.replace(/\[.+?\]/gi, '')
            // debugLog('meaning', meaning)
            that.setData({
              meaning: meaning
            })
          } catch (e) { }

        },
        fail: (res, res2) => {
          debugLog('request.fail.res', res)
        },
        complete: (res) => {
          // debugLog('request.complete.res', res)
        }
      })
    },
    /**
     * 关闭对话框
     */
    onClose: function (e) {
      let that = this
      that.setData({
        isShown: false
      }, res => {
        that.triggerEvent('close')
      })
    }
  }
})
