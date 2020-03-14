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
  reqUtils.request(reqParams, (result)=>{
    debugLog('search', 'result')
  })
}


module.exports = {
  search: search
}