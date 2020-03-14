const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const debugLog = require('log.js').debug;
const errorLog = require('log.js').error;
const MSG = require('../const/message.js') 
const utils = require('util.js')



/**
 * 请求网站内容
 */
function request(reqParams, callback) {
  let url = reqParams.url
  let method = reqParams.method ? reqParams.method : 'GET'
  let timeout = reqParams.timeout ? reqParams.timeout : 10000
  wx.request({
    method: method,
    timeout: timeout,
    url: url,
    success: (res, other) => {
      utils.runCallback(callback)(res)
    },
    fail: (err) => {
      //   debugLog('request.fail.res', res)
      utils.runCallback(callback)(null)
    },
    complete: (res) => {
      // debugLog('request.complete.res', res)
    }
  })
}

/**
 * 把对象转换为Uri Query String
 */
function toUriQuery(params){
  let queryStr = ''
  if(params && Object.keys(params).length > 0){
    let keys = Object.keys(params)
    for (let i in keys){
      let key = keys[i]
      let value = params[key] 
      if (value
        && value != null 
        && value != undefined 
        && typeof value != 'object'){
          if(i == 0){
            queryStr += '?' + key + '=' + value
          }else{
            queryStr += '&' + key + '=' + value
          }
      }
    }
  }
  return queryStr
}

module.exports = {
  request: request,
  toUriQuery: toUriQuery,
  METHODS: {
    GET: 'GET',
  }
}