
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const debugLog = require('log.js').debug;
const errorLog = require('log.js').error;
const MSG = require('../const/message.js')

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatOnlyTime = date => {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [hour, minute, second].map(formatNumber).join(':')
}

function formatDateTime(date){
  let dateStr = formatDate(date)
  let timeStr = formatOnlyTime(date)
  let dateTimeStr = dateStr + " " + timeStr
  return dateTimeStr;
}

function mergeDateTime(pDateStr, pTimeStr){
  // debugLog('bindLastDateChange.dateStr', pDateStr)
  // debugLog('bindLastDateChange.timeStr', pTimeStr)
  let dateStr = pDateStr.replace(/\//ig, '-')
  let date = new Date(dateStr + 'T' + pTimeStr + ':00Z');
  // debugLog('bindLastDateChange.date', date)
  // 因为中国处于东八区
  date.setHours(date.getHours() - 8)
  // debugLog('bindLastDateChange.date', date.toLocaleString())
  return date;
}

const formatDate = (date, seperator = '/') => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return [year, month, day].map(formatNumber).join(seperator)
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatDeciTimer = function(pDeciSecond, unitStartIdx){
  try{
    if (!unitStartIdx){
      unitStartIdx = 0
    }
    let nextUnitValue = pDeciSecond
    let formatDeciTimerStr = ''
    let timeUnits = gConst.TIME_UNITS
    let timeUnitIdx = 0
    do{
      if (unitStartIdx <= timeUnitIdx){
        formatDeciTimerStr = nextUnitValue % timeUnits[timeUnitIdx].interval + timeUnits[timeUnitIdx].name + formatDeciTimerStr
      }
      // debugLog('timeUnits[timeUnitIdx].interval', timeUnits[timeUnitIdx].interval)
      nextUnitValue = Math.floor(nextUnitValue / timeUnits[timeUnitIdx].interval)
      timeUnitIdx +=1
      // debugLog('nextUnitValue', nextUnitValue)
    } while (nextUnitValue > 0)
    return formatDeciTimerStr
  }catch(e){
    return '00时00分00秒0毫秒'
  }
}

const log = function (object, message, tabs) {
  if (tabs == undefined) {
    tabs = 4
  }

  if (message == undefined) {
    message = 'object'
  }
  console.log(message + ':' + JSON.stringify(object, tabs))
}

const resetStatus = function (object, key, defaultValue, setValue) {
  // debugLog(object);
  // debugLog(setValue);
  for (let i in object) {
    if (i == key) {
      object[i] = setValue;
    } else {
      object[i] = defaultValue;
    }

  }
  // debugLog(object);
}

const cloneObj = function (source, target) {
  return Object.assign(target, source);
}

const pickerMaker = function (array, selectProperty) {
  // debugLog('array', array);
  let res = {
    pickerObjs: {},
    pickerList: []
  }
  for (let i in array) {
    // debugLog('i', i);
    let obj = array[i]
    // debugLog('obj',obj);
    // If not exist, append one
    if (!res.pickerObjs[obj[selectProperty]]) {
      res.pickerObjs[obj[selectProperty]] = obj
      res.pickerList.push(obj[selectProperty])
    }
  }
  return res;
}

const getUserInfo = function (globalData) {
  let userInfo = {}
  if (globalData.userInfo && globalData.userInfo != '') {
    userInfo = globalData.userInfo;
  } else {
    userInfo = wx.getStorageSync('userInfo')
  }

  return userInfo
}

const setUserInfo = function (userInfo, globalData) {
  globalData.userInfo = userInfo
  wx.setStorageSync('userInfo', userInfo)
  // debugLog('setUserInfo', wx.getStorageSync('userInfo'))
}

const extractFileInfo = function (filePath) {
  // debugLog('extractFileInfo.filePath', filePath)
  let fileInfo = {
    path: filePath,
    directory: '',
    filename: '',
    fileMajorName: '',
    fileExtension: ''
  }
  let regex = new RegExp("(.+/)(([^/]+)(\\.[^.]+))", "gim")
  let regexGroups = regex.exec(filePath)
  // debugLog('extractFileInfo.regexGroups', regexGroups)
  if (regexGroups != undefined && regexGroups[1]) {
    fileInfo.directory = regexGroups[1]
  }
  if (regexGroups != undefined && regexGroups[2]) {
    fileInfo.filename = regexGroups[2]
  }
  if (regexGroups != undefined && regexGroups[3]) {
    fileInfo.majorName = regexGroups[3]
  }
  if (regexGroups != undefined && regexGroups[4]) {
    fileInfo.extension = regexGroups[4]
  }
  // debugLog('extractFileInfo.fileInfo', fileInfo)
  return fileInfo

}

const getUserRole = function(inputVertifyCode){
  let userRoleObjs = wx.getStorageSync(gConst.USER_ROLES_OBJS_KEY)
  for (let i in userRoleObjs){
    if (userRoleObjs[i].vertifyCode == inputVertifyCode){
      return userRoleObjs[i].name
    }
  }
  return ''
}

const getTotalScore = function(userInfo, callback){
  // try{
    let openid = userInfo.openId
    // 什么时机刷新积分
    let refreshScoreInterval = Math.floor(new Date().getTime() / 1000) % 1
    // debugLog('refreshScoreInterval', refreshScoreInterval)
    if (!wx.getStorageSync(storeKeys.totalScore)
      || refreshScoreInterval >= 0){
      // debugLog('openid', openid)
      if(!openid){return}
      // debugLog('get sync total score')
      wx.cloud.callFunction({
        name: 'learnHistoryAggregate',
        data: {
          openid: openid
        },
        success: res => {
          // debugLog('learnHistoryAggregate.success.res', res)
          if (res && res.result && res.result.score){
            wx.setStorageSync(storeKeys.totalScore, parseFloat(res.result.score))
            callback(res.result)
          }else{
            wx.setStorageSync(storeKeys.totalScore, 0)
          }
        },
        fail: err => {
          errorLog('[云函数] 调用失败：', err)
        }
      })
    }else{
      callback({
        openid: openid
        ,score: wx.getStorageSync(storeKeys.totalScore)
      })
      return wx.getStorageSync(storeKeys.totalScore)
    }
  // }catch(e){
  //   // wx.setStorageSync(storeKeys.totalScore, 0)
  // }
}

/**
 * 分类统计练习
 *
 *  功能不可用，因为传过去的group没有起作用
 */
const getGamingStatistics = function (userInfo, callback) {
  // try{
  let openid = userInfo.openId
  // 什么时机刷新积分
  // debugLog('openid', openid)
  if (!openid) { return }
  // debugLog('get sync total score')
  let db = wx.cloud.database()
  let $ = db.command.aggregate
  let _ = db.command
  wx.cloud.callFunction({
    name: 'learnHistoryAggregate',
    data: {
      openid: openid,
      matchOptions: {
        openid: openid,
      },
      groupOptions: {
        _id: {
          openid: '$openid',
          nickName: '$nickName'
        },
        score: $.sum('$score'),
        thinkTime: $.avg('$thinkSeconds'),
      },
    },
    success: res => {
      // debugLog('learnHistoryAggregate.success.res', res)
      callback(res.result)
    },
    fail: err => {
      errorLog('[云函数] 调用失败：', err)
    }
  })
  // }catch(e){
  //   errorLog("getGamingStatistics error", e)
  // }
}


/**
 * join array with object
 */
function arrayJoin(array, joinProp, seperator){
  if (!seperator){
    seperator = ','
  }
  let result = ''
  for(let i in array){
    result += array[i][joinProp]
    if(i < array.length -1){
      result += seperator
    }
  }
  return result
}

/**
 * 刷新用户角色
 */
function refreshUserRoleConfigs(){
  const configsApi = require('../api/configs.js')
  configsApi.getConfigs({
    tags: gConst.CONFIG_TAGS.USER_ROLE_TAG
  }, 0, (configs, pageIdx)=>{
    // debugLog('refreshUserRoleConfigs.configs', configs);
    wx.setStorageSync(gConst.USER_ROLES_OBJS_KEY, configs)
    let userRoles = {}
    let registerVertifyCode = {}
    for(let i in configs){
      userRoles[configs[i].value] = configs[i].name
      registerVertifyCode[configs[i].value] = configs[i].vertifyCode
    }
    wx.setStorageSync(gConst.USER_ROLES_KEY, userRoles)
    wx.setStorageSync(gConst.VERTIFY_CODE_KEY, registerVertifyCode)
  })
}

/**
 * 刷新系统配置
 */
function refreshConfigs(configGroupTag, callback) {
  const configsApi = require('../api/configs.js')
  let pageIdx = 0
  // let dataLoadTimer = null
  // clearInterval(dataLoadTimer)
  // dataLoadTimer = setInterval(function () {
    configsApi.getConfigs({
      tags: configGroupTag
    }, pageIdx, (configs, pageIdx) => {
      // debugLog('refreshConfigs.configs', configs);
      if (configs.length && configs.length > 0) {
        let configsLoaded = wx.getStorageSync(configGroupTag)
        if (configsLoaded){
          configsLoaded = []
        }
        configsLoaded = configsLoaded.concat(configs)
        if(callback)callback(configGroupTag, configsLoaded)
        wx.setStorageSync(configGroupTag, configsLoaded)
      } else {
        clearInterval(dataLoadTimer)
      }
    })
  //   pageIdx++
  // }, 100)
}

/**
 * 按标签获取配置
 */
function getConfigs(configGroupTag, ifRefreshData, callback) {
  let configs = wx.getStorageSync(configGroupTag)
  if(ifRefreshData||!configs){
    refreshConfigs(configGroupTag, (configType, configs)=>{
      if (callback)callback(configType, configs)
    })
  }
  return configs
}

/**
 * get properties Array from Objects' Array
 */
function getArrFromObjectsArr(objects, propName){
  let array = []
  if (objects && objects.length > 0){
    for (let i in objects){
      array.push(objects[i][propName])
    }
  }

  return array
}

/**
 * 以特定的字段为主键，把数组转化为对象
 */
function array2Object(array, pKey){
  let object = {}
  if (array && array.length > 0) {
    for (let i in array) {
      // debugLog('array[i]', array[i])
      let key = array[i][pKey]
      // debugLog('key', key)
      object[key] = array[i]
      // debugLog('object[key]', object)
    }
  }
  return object
}

/**
 * 根据Array对象里面的属性排序
 * sortProp： 用来排序的字段
 * order：降序：-1，升序：1
 */
const ORDER = {
  ASC: -1,
  DESC: 1,
}

function sortByPropLenArray(array, sortProp, order){
  let sortedArray = array.sort((a,b)=>{
    if (a[sortProp].length < b[sortProp].length){
      return order
    } else if (a[sortProp].length > b[sortProp].length ) {
      return -order
    } else if (a[sortProp].length == b[sortProp].length ) {
      if (a[sortProp] < b[sortProp]) {
        return order
      } else if (a[sortProp] > b[sortProp]) {
        return -order
      } else if (a[sortProp] == b[sortProp]) {
        return 0
      }
    }

  })
  return sortedArray
}

const DATA_LOAD_INTERVAL = '数据加载间隔'
const DEFAULT_DATA_LOAD_INTERVAL = 5000
function getDataLoadInterval(){
  try{
    let systemConfig = wx.getStorageSync(gConst.CONFIG_TAGS.SYSTEM_CONFIG)
    // debugLog('getDataLoadInterval.systemConfig', systemConfig)
    return systemConfig.find(config => config.name == DATA_LOAD_INTERVAL).value
  }catch(e){
    return DEFAULT_DATA_LOAD_INTERVAL
  }
}

function initStorage(){
  let totalScore = wx.getStorageSync('totalScore')
  if (!totalScore && totalScore != 0){
    wx.setStorageSync('totalScore', 0)
  }

  let userConfigs = wx.getStorageSync('userConfigs')
  if (!userConfigs && userConfigs != 0) {
    wx.setStorageSync('userConfigs', false)
  }
}

/**
 * 获取Event事件的Detail.Value
 */
function getEventDetailValue(e){
  let value = ''
  try{
    value = e.detail.value
  }catch(e){
    // value = ''
  }
  return value
}
/**
 * 获取Event事件的Detail
 */
function getEventDetail(e) {
  let detail = ''
  try {
    detail = e.detail
  } catch (e) {
    // value = ''
  }
  return detail
}
/**
 * 获得Event事件的Dataset
 */
function getEventDataset(e){
  // debugLog('getDataset.e',e)
  let dataset1
  let dataset2
  try{
    dataset1 = e.target.dataset}catch(e){}
  try {
    dataset2 = e.currentTarget.dataset
  } catch (e) { }
  // debugLog('Object.keys(dataset1).length', Object.keys(dataset1).length)
  if (Object.keys(dataset1).length < 1){
    // debugLog('Object.keys(dataset2)', e.currentTarget.dataset)
    return e.currentTarget.dataset
  }else{
    // debugLog('Object.keys(dataset1)', Object.keys(dataset1))
    return e.target.dataset
  }
}

function getStorage(key){
  let storageVar = wx.getStorageSync(key)
  if (!storageVar && storageVar != 0){
    storageVar = false
  }
  return storageVar;
}

function runCallback(callback){
  if(callback && typeof callback == 'function'){
    return callback
  }else{
    return ()=>{
      debugLog('I am a null fuction')
    }
  }
}

/**
 * 一次性循环加载多页
 * pTimeout默认是500
 */
function loadPagesData(callback, timeout=500) {
  let pageIdx = 0
  let loadTimer = setInterval(() => {
    if (pageIdx < 100) {
      runCallback(callback)(pageIdx, loadTimer)
      pageIdx++
    } else {
      clearInterval(loadTimer)
    }
  }, timeout)
}

/**
 * 判断是不是标点
 */
function isPunctuation(letter) {
  var result = false;
  // console.log('letter:', letter)
  switch (letter) {
    case "，":
      result = true
      break;
    case "。":
      result = true
      break;
    case "？":
      result = true
      break;
    case "；":
      result = true
      break;
    case "！":
      result = true
      break;
    default:
  }
  return result;
}

/**
 * 根据当前Ebbinghaus Rate 获得下一级的Ebbinghaus Rate
 * 如果不传参数返回第一个
 */
function nextEbbingRate(pEbbRate) {
  let ebbingRates = getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
  if (!pEbbRate) {
    return ebbingRates[0]
  }
  for (let i in ebbingRates) {
    if ((pEbbRate.orderIdx + 1) == ebbingRates[i].orderIdx) {
      return ebbingRates[i]
    }
  }
  // 如果找不到就返回本身
  return pEbbRate
}

/**
 * 根据当前Ebbinghaus Rate 获得上一级的Ebbinghaus Rate
 * 如果不传参数返回第一个
 */
function prevEbbingRate(pEbbRate) {
  let ebbingRates = getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
  if (!pEbbRate) {
    return ebbingRates[0]
  }
  for (let i in ebbingRates) {
    if ((pEbbRate.orderIdx - 1) == ebbingRates[i].orderIdx) {
      return ebbingRates[i]
    }
  }
  // 如果找不到就返回本身
  return pEbbRate
}

/**
 * 显示On loading
 */
function onLoading(pMsg){
  let msg = MSG.ON_LOADING
  if(msg && typeof msg == 'string'){
    msg = pMsg
  }
  wx.showLoading({
    title: msg,
  })
  setTimeout(() => {
    wx.hideLoading()
  }, 10000)
}

/**
 * 停止加载时候调用
 */
function stopLoading(){
  wx.hideLoading()
  wx.stopPullDownRefresh()
}

/**
 * 从path中获取文件名
 */
function getFilename(path){
  let res = /[^\/\\]+$/gi.exec(path)
  if(res && res.length > 0){
    return res[0]
  }
}

/**
 * 从path中获取文件扩展名
 */
function getFileExtension(path) {
  let res = /[^.]+$/gi.exec(path)
  if (res && res.length > 0) {
    return res[0]
  }
}

module.exports = {
  /** 工具型方法 */

  /* -- Event 方法 -- */
  getEventDataset: getEventDataset,
  getEventDetailValue: getEventDetailValue,
  getEventDetail: getEventDetail,

  array2Object: array2Object,
  runCallback: runCallback,
  loadPagesData: loadPagesData,

  /* -- 时间相关 -- */
  formatOnlyTime: formatOnlyTime,
  formatTime: formatTime,
  formatDate: formatDate,
  formatDeciTimer: formatDeciTimer,
  formatDateTime: formatDateTime,
  mergeDateTime: mergeDateTime,

  getFilename: getFilename,
  getFileExtension: getFileExtension,
  isPunctuation: isPunctuation,
  resetStatus: resetStatus,
  cloneObj: cloneObj,
  pickerMaker: pickerMaker,
  extractFileInfo: extractFileInfo,
  arrayJoin: arrayJoin,
  getArrFromObjectsArr: getArrFromObjectsArr,
  ORDER: ORDER,
  sortByPropLenArray: sortByPropLenArray,


  /** 功能型方法 */
  nextEbbingRate: nextEbbingRate,
  prevEbbingRate: prevEbbingRate,
  refreshUserRoleConfigs: refreshUserRoleConfigs,
  refreshConfigs: refreshConfigs,
  getConfigs: getConfigs,
  getGamingStatistics: getGamingStatistics,
  getUserRole: getUserRole,
  getTotalScore: getTotalScore,
  getUserInfo: getUserInfo,
  setUserInfo: setUserInfo,
  getDataLoadInterval: getDataLoadInterval,
  initStorage: initStorage,
  getStorage: getStorage,
  onLoading: onLoading,
  stopLoading, stopLoading,
}
