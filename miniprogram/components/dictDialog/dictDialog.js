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
    'isShown, dictMode, word, char': function (isShown, dictMode, word, char) {
      let that = this
      debugLog('observers.dictMode', dictMode)
      if(isShown == true){
        if (dictMode == gConst.DICT_SEARCH_MODE.WORD){
          debugLog('observers.word', word)
          that.searchWordMeaning(that, word);
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
    searchWordMeaning(that, word){
      // let regex = new RegExp('data-type-block="词语解释"[^>]+?>(?:.+?)(<div class="content definitions".+?)(?:<div class="div copyright">)', 'gi')
      let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(data-type-block="网友讨论")', 'gi')
      that.searchMeaning(that, regex, word)
    },

    /**
     * 获取字的解释
     */
    searchCharMeaning(that, char) {
      let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(?:data-type-block="网友讨论")', 'gi')
      that.searchMeaning(that, regex, char)
    },    
    /**
     * 获取单词/字解释
     */
    searchMeaning(that, regex, content){
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
          // let context = data.replace(/\n/gi, '')
          // let pyRegExp = new RegExp('class="z_ts2">(拼音).+?class="dicpy">([^<]+?)</span>','gi')
          // debugLog('request.success.context', context)
          
          // let pyRst = pyRegExp.exec('<p><span class="z_ts2">拼音</span> <span class="dicpy">tóng gān gòng kǔ</span>  <span class="z_d song"><span class="ptr"><a class="audio_play_button i_volume - up ptr cd_au" title="同甘共苦"></a></span></span></p>')
          let rst = regex.exec(context)
          debugLog('request.success.rst', rst)
          try{
            
            let meaning = rst[1] + '</div></div></div>'
            meaning = meaning.replace(/\[.+?\]/gi, '')
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
