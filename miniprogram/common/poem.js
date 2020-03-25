const app = getApp()
const globalData = app.globalData
// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const reqUtils = require('../utils/request.js');

const POEM_SEARCH_PREFIX = 'https://so.gushiwen.org/search.aspx'
const DEFAULT_TIMEOUT = 10000
function search(key, callback){
  let queryStr = reqUtils.toUriQuery({value: key.trim()})
  let reqParams = {
    url: POEM_SEARCH_PREFIX + queryStr,
    method: reqUtils.METHODS.GET,
    timeout: DEFAULT_TIMEOUT
  }
  reqUtils.request(reqParams, result=>{
    
    result = result.replace(/(\r|\n|\t|\s{3})/gi, '')
    result = result.replace(/<script.+?<\/script>/gi, '')
    result = result.replace(/<!DOCTYPE.+?>/gi, '')
    debugLog('result', result)
    let regex = new RegExp('(<div)', 'gi')
    // new RegExp('(<div class="main3">.*?<div class="left">.*?)(?:<form id="FromPage")', "igm")
    let rst = regex.exec("<div <div <div")
    debugLog('rst', rst)
    debugLog('rst', rst.length)
    regex.compile('(<div class="sons">.+?</div>)[^<]+?(?:<div style=" width:1px; height:1px; overflow:hidden;">)', "img")
    // rst = regex.exec(result)
    // debugLog('rst', rst)
    // debugLog('rst', rst.length)

  })
}


module.exports = {
  search: search,

}