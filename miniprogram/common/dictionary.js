const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');

// Api Handler
const dbApi = require('../api/db.js')
const configsApi = require('../api/configs.js')
const ON_LOADING_TIMEOUT = 10000

/**
 * 点击标签过滤页的表名
 */
const SELECTED_CSS = 'selected'
function selectLang(that, e, callback) {//   debugLog('selectLang.dataset', e.target.dataset)
  let dataset = utils.getEventDataset(e)
  let value = dataset.langValue
  let idx = parseInt(dataset.langIdx)
  let selObj = that.data.selLang
  let list = that.data.langs

  selectedCSS(list, idx, value, selObj, (list, obj)=>{
    that.setData({
      langs: list,
      selLang: obj,
    })
  })


  resetDictionaryPage(that, () => {
  })
}

/**
 * 设置选中的项目的CSS
 */
function selectedCSS(list, nowIdx, nowValue, oldSelObj, callback){
  if (oldSelObj && nowValue == oldSelObj.value) {
    return;
  }
  for (let i in list) {
    if (i == nowIdx) {
      oldSelObj = list[i]
      list[i]['css'] = SELECTED_CSS
    } else {
      list[i]['css'] = ''
    }
  }
  if(callback && typeof callback == 'function'){
    callback(list, oldSelObj)
  }
}

/**
 * 重置词典
 */
function resetDictionaryPage(that, callback){
  that.setData({

  })
  if(callback && typeof callback == 'function'){
    callback(that)
  }

}

/**
 * 初始化页面
 */
function initPage(that, options){
  let langs = that.data.langs
  let mockupEvent = {
    target: {
      dataset: {
        langIdx: 0,
        langValue: langs[0].value
      }
    }
  }
  selectLang(that, mockupEvent)
}

/**
 * 获取单词解释
 */
function searchCnWordMeaning(that, word){
  // let regex = new RegExp('data-type-block="词语解释"[^>]+?>(?:.+?)(<div class="content definitions".+?)(?:<div class="div copyright">)', 'gi')
  let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(?:<div class="zdict">[^<]+?<div class="dictentry">[^<]+?<div class="nr-box nr-box-shiyi wytl" data-type-block="网友讨论")', 'gi')
  searchCnMeaning(that, regex, word)
}

/**
 * 获取字的解释
 */
function searchCharMeaning(that, char) {
  let regex = new RegExp('<div class="dictionaries zdict">((?:(?!data-type-block="网友讨论).)+?)(?:<div class="zdict">[^<]+?<div class="dictentry">[^<]+?<div class="nr-box nr-box-shiyi wytl" data-type-block="网友讨论")', 'gi')
  searchCnMeaning(that, regex, char)
}

/**
 * 获取中文单词/字解释
 */
function searchCnMeaning(that, regex, content){
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
      try {
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
            complete: res => {
              throw new Error("meaning is empty")
            },
          })

        }

        // debugLog('meaning', meaning)
        that.setData({
          meaning: meaning
        }, res => {
          if (that.data.dictMode == gConst.DICT_SEARCH_MODE.WORD) {
            updateWordMeaning(that, that.data.table, that.data.word, that.data.meaning)
          }
          wx.hideLoading()
        })
      } catch (e) {
        that.setData({
          meaning: '',
        })
      }

    },
    fail: (res, res2) => {
   //   debugLog('request.fail.res', res)
    },
    complete: (res) => {
      // debugLog('request.complete.res', res)
    }
  })
}

/**
* 获取英语单词/字解释
*/
function searchEnMeaning(that, content) {
  that.setData({
    meaning: ''
  })
  const MEANING_URI_PREFIX = 'https://dictionary.cambridge.org/zhs/词典/英语-汉语-简体/'
  let uri = MEANING_URI_PREFIX + content
// debugLog('searchEnMeaning.uri', uri)
  let timeout = 10000
  wx.request({
    method: 'GET',
    timeout: 10000,
    url: uri,
    success: (res, res2) => {

      let context = res.data.replace(/(\r|\n|\t)/gi, '')
      // let context = data.replace(/\n/gi, '')
      let regex = new RegExp('(<div class="di-body">.+?)(?:<small)', 'gi')
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
        if (!meaning || meaning.trim() == '') {
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
        }, res => {
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
}

function launchSearchKeyword(that){
  wx.showLoading({
    title: MSG.ON_LOADING,
  })
  setTimeout(res => {
    wx.hideLoading()
  }, ON_LOADING_TIMEOUT)
  let dictMode = that.data.dictMode
  let langValue = that.data.selLang.value
  let word = that.data.curKeyword
  if (dictMode == gConst.DICT_SEARCH_MODE.WORD) {
    // debugLog('observers.word', word)
    getWordMeaning(that, langValue, word, res => {
      // debugLog('getWordMeaning.res', res)
      if (!res) {
        // debugLog('getWordMeaning.search.from.web', )
        if (langValue.includes('chinese')) {
          searchCnWordMeaning(that, word);
        } else if (langValue.includes('english')) {
          searchEnMeaning(that, word);
        }
      }
    })
  } else if (dictMode == gConst.DICT_SEARCH_MODE.CHAR
    && word != null && word.length > 0) {
    // debugLog('observers.char', char)
    searchCharMeaning(that, word);
  }
}

function setDictMode(that, e,  callback){
  let dictMode = gConst.DICT_SEARCH_MODE.WORD
  let curKeyword = utils.getEventDetailValue(e)
  try {
    curKeyword = curKeyword.trim()
    if (curKeyword.length == 1){
      dictMode = gConst.DICT_SEARCH_MODE.CHAR
    }else{
      dictMode = gConst.DICT_SEARCH_MODE.WORD
    }
  } catch (e) {
    wx.showToast({
      title: MSG.FEATURE_IS_DISABLE,
    })
    return
  }
  that.setData({
    dictMode: dictMode,
    curKeyword: curKeyword,
  }, ()=>{
    if(callback && typeof callback == 'function'){
      callback(that)
    }
  })
}

/**
 * 获取单词解释
 */
function getWordMeaning(that, table, word, callback) {
  // debugLog('getWordMeaning.run...')
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
      try {
        let list = res.result.data
        if (list && list.length > 0 && list[0].htmlMeaning.length > 0) {
          callback(list[0])
        } else {
          callback(null)
        }
        that.setData({
          meaning: list[0].htmlMeaning
        })
      } catch (err) {
        callback(null)
      }

    },
    fail: err => {
      errorLog('getWordMeaning.err', err)
    }
  })
}

/**
 * 更新单词的解释
 */
function updateWordMeaning(that, table, word, meaning) {
  // debugLog('updateWordMeaning.run...')
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
    success: res => {
      // debugLog('updateWordMeaning.res', res)
    },
    fail: err => {
      errorLog('updateWordMeaning.err', err)
    }
  })
}

module.exports = {
  selectLang: selectLang,
  resetDictionaryPage: resetDictionaryPage,
  selectedCSS: selectedCSS,
  initPage: initPage,
  searchCnWordMeaning: searchCnWordMeaning,
  searchCharMeaning: searchCharMeaning,
  searchCnMeaning: searchCnMeaning,
  searchEnMeaning: searchEnMeaning,
  setDictMode: setDictMode,
  launchSearchKeyword: launchSearchKeyword,
  getWordMeaning: getWordMeaning,
  updateWordMeaning: updateWordMeaning,
}
