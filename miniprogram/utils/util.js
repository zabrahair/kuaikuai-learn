
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
  let date = new Date(dateStr + 'T' + pTimeStr + ((pTimeStr.length == 5) ? ':00Z' : 'Z'));
  // 因为中国处于东八区
  date.setHours(date.getHours() - 8)
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
    let isOverZero = ''
    if (Math.abs(pDeciSecond) != pDeciSecond){
      isOverZero = '-'
    }
    let nextUnitValue = Math.abs(pDeciSecond)
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
    return isOverZero + formatDeciTimerStr
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

/**
 * 将对象中特定的属性恢复到默认值除了特定位置的key:value
 */
const resetObjectValues = function (object, key, defaultValue, setValue) {
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
  // if (globalData.userInfo && globalData.userInfo != '') {
  //   userInfo = globalData.userInfo;
  // } else {
    userInfo = wx.getStorageSync('userInfo')
    // debugLog("getUserInfo.userInfo", userInfo)
  // }

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
  debugLog('getUserRole.start', inputVertifyCode)
  let userRoleObjs = wx.getStorageSync(gConst.USER_ROLES_LIST_KEY)
  debugLog('getUserRole.userRoleObjs', userRoleObjs)
  for (let i in userRoleObjs){
    debugLog('getUserRole.for', userRoleObjs[i])
    if (userRoleObjs[i].vertifyCode == inputVertifyCode){
      debugLog('getUserRole.found', inputVertifyCode)
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
    if(typeof array[i] == 'string'){
      result += array[i]
      if (i < array.length - 1) {
        result += seperator
      }
    }else if(typeof array[i] == 'object'){
      result += array[i][joinProp]
      if (i < array.length - 1) {
        result += seperator
      }
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
    wx.setStorageSync(gConst.USER_ROLES_LIST_KEY, configs)
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
 * order：降序：1，升序：-1
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
      // debugLog('I am a null fuction')
    }
  }
}

/**
 * 一次性循环加载多页
 * pTimeout默认是500
 */
const IS_CONTINUE_LOAD = {
  TRUE: {
    name: "继续",
    value: true
  },
  FALSE: {
    name: "等待",
    value: false
  }
}
function loadPagesData(callback, timeout=500) {
  let pageIdx = 0
  let isContinue = Object.assign({}, IS_CONTINUE_LOAD.TRUE)
  let usedTime = 0
  let loadTimer = setInterval(() => {
    usedTime += timeout
    if (isContinue.value == true){
      if (pageIdx < 100) {
        // 之所以不能赋值是因为我们要保持isContinue原先指向的指针
        Object.assign(isContinue, IS_CONTINUE_LOAD.TRUE)
        runCallback(callback)(pageIdx, loadTimer, isContinue)
        pageIdx++
      } else {
        clearInterval(loadTimer)
      }
    }
    if (usedTime > 300000){
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

/**
 * 根据属性从列表中选中一个对象
 */
function getObjFromArray(array, key, value){
  for(let i in array){
    let elem = array[i]
    if (elem[key] == value) {
      return elem
    }
  }
}

/**
 * 通过日期数组获得Date型
 *
 */
function getDateFromStr(dateStr){
  let date = mergeDateTime(dateStr, '00:00:00')
  return date;
}

/** 
 * 加载所有的配置方法
 */
const LAST_LOAD_CONFIGS_TIMESTAMP = 'LAST_LOAD_CONFIGS_TIMESTAMP'
const CONFIG_INDEX = 'CONFIG_INDEX'
const CONFIG_MAP = 'CONFIG_MAP'
function loadAllConfigs(isForceReload = false){
  // 加载所有的配置项目
  let db = wx.cloud.database()
  let $ = db.command.aggregate
  let _ = db.command
  let rawConfigs = []
  let lastLoadConfigsTimeStamp = wx.getStorageSync(LAST_LOAD_CONFIGS_TIMESTAMP)
  lastLoadConfigsTimeStamp = lastLoadConfigsTimeStamp ? lastLoadConfigsTimeStamp: 0
  // 如果配置更新实践少于3600000毫秒不更新
  if ((new Date().getTime() - lastLoadConfigsTimeStamp) < 3600000 && isForceReload == false){
    return
  }
  onLoading('配置加载中')
  loadPagesData((pageIdx, loadTimer, isContinue) => {
    wx.cloud.callFunction({
      name: 'GetAllConfigGroups',
      data: {
        pageIdx: pageIdx,
      },
      success: res => {
        let list = res.result.list
        try {
          if (list && list.length > 0) {
            // debugLog('loadAllConfigs.list', list)
              isContinue.value = true
              rawConfigs  = rawConfigs.concat(list)
          } else {
            // 当加载完成
            // debugLog('loadAllConfigs.rawConfigs', rawConfigs)
            clearInterval(loadTimer)
            switchProcessAllConfigs(rawConfigs)
          }
        } catch (err) {
          errorLog('[云函数] 调用失败：', err.stack)
          clearInterval(loadTimer)
          wx.showToast({
            image: gConst.ERROR_ICON,
            title: MSG.SOME_EXCEPTION,
            duration: 1000,
          })
        }
      },
      fail: err => {
        errorLog('[云函数] 调用失败：', err.stack)
        clearInterval(loadTimer)
        wx.showToast({
          image: gConst.ERROR_ICON,
          title: MSG.SOME_EXCEPTION,
          duration: 1000,
        })
      }
    }) 
  }, getDataLoadInterval())
}
/**
 * 将加载进来的Configs分存到不同的Storage的key:value中
 */
function switchProcessAllConfigs(rawConfigs){
  // debugLog('switchProcessAllConfigs.params', rawConfigs)
  let configIndex = []
  let configIndexMap = {}
  for (let i in rawConfigs){
    let type = rawConfigs[i]._id
    let configs = rawConfigs[i].list
    let configsMap  = array2Object(configs, 'name')
    configIndex.push(type)
    configIndexMap[type] = configsMap
    switch(type){
      case 'USER_ROLE':
        let userRolesNameMap = {}
        let userRolesVertifyCodeMap = {}
        for (let i in configs){
          userRolesNameMap[configs[i].value] = configs[i].name
          userRolesVertifyCodeMap[configs[i].value] = configs[i].vertifyCode
        }
        wx.setStorageSync(gConst.USER_ROLES_LIST_KEY, configs)
        // wx.setStorageSync(type + '_MAP', configsMap)
        wx.setStorageSync(gConst.USER_ROLES_KEY, userRolesNameMap)
        wx.setStorageSync(gConst.REGISTER_VERTIFY_CODE, userRolesVertifyCodeMap)
        break;
      // case 'TASK_STATUS':
      // case 'SYSTEM_CONFIG':
      // case 'COMBO_TYPE':
      // case 'ANSWER_TYPE':
      // case 'BONUS_CLASSES':
      // case 'EBBINGHAUS_RATES':
      // case 'ANSWER_RESULT':
      default:
        wx.setStorageSync(type + '', configs)
        // wx.setStorageSync(type + '_MAP', configsMap)
        break;
    }
  }
  wx.setStorageSync(LAST_LOAD_CONFIGS_TIMESTAMP, new Date().getTime())
  wx.setStorageSync(CONFIG_INDEX, configIndex)
  wx.setStorageSync(CONFIG_MAP, configIndexMap)
  stopLoading()
}

/**
 * 给对象加事件字段
 */
function addTime2Object(type, object){
  let now = new Date()
  switch(type){
    case 'create':
      object['createTime'] = now.getTime()
      object['createTimeStr'] = formatDateTime(now)   
      break;
    case 'update':
      object['updateTime'] = now.getTime()
      object['updateTimeStr'] = formatDateTime(now)   
      break;
    default:
  }

  return object
}

/**
 * 加载字体
 */
function loadFonts(){
  // 楷体
  wx.loadFontFace({
    family: 'Kaiti',
    source: 'url("https://6b75-kuaikuai-fjpqg-1301178064.tcb.qcloud.la/mp-fonts/KaitiGB2312.ttf?sign=5e1bfcd20a0c093bb4ca278307be9cbf&t=1585042613")',
    success: {}
  })  
}

/**
 * 通过一个Range返回一个数字数组
 */
function getRange(start, end, step){
  let array = []
  let i = start
  if(start >= end){
    return null
  }
  for(i; i <= end; i+=step){
    array.push(i)
  }

  return array
}

/**
 * 获取时间区间选择器的数据
 */
function getTimePeriodPickerData(){
  let array = [
    {
      showName: '月',
      name: 'month',
      value: getRange(0, 12, 1)
    },
    {
      showName: '星期',
      name: 'week',
      value: getRange(0, 7, 1)
    },
    {
      showName: '天',
      name: 'day',
      value: getRange(0, 30, 1)
    },
    {
      showName: '时',
      name: 'hour',
      value: getRange(0, 24, 1)
    },
    {
      showName: '分',
      name: 'minute',
      value: getRange(0, 60, 1)
    }
  ]
  return array
}

/**
 * 获取时间区间对象
 */
function getTimePeriodObj(){
  let object = {
    month: {
      showName: '月',
      name: 'month',
      unitMillSecs: 2592000000,
      value: 0
    },
    week: {
      showName: '星期',
      name: 'week',
      unitMillSecs: 604800000,
      value: 0
    },
    day: {
      showName: '天',
      name: 'day',
      unitMillSecs: 86400000,
      value: 0
    },
    hour: {
      showName: '时',
      name: 'hour',
      unitMillSecs: 3600000,
      value: 0
    },
    minute: {
      showName: '分',
      name: 'minute',
      unitMillSecs: 60000,
      value: 0
    }
  }
  return object
}
/**
 * 通过事件跨度获取毫秒数
 */
function getMillSecsFromPeriod(timePeriod){
  let totalMillSecs = 0
  let keys = Object.keys(timePeriod)
  for (let i in keys){
    let key = keys[i]
    totalMillSecs += timePeriod[key].value * timePeriod[key].unitMillSecs
  }
  return totalMillSecs
}

module.exports = {
  /** 工具型方法 */

  /* -- Event 方法 -- */
  getEventDataset: getEventDataset,
  getEventDetailValue: getEventDetailValue,
  getEventDetail: getEventDetail,

  /* -- Object & Array 相关 -- */
  array2Object: array2Object,
  arrayJoin: arrayJoin,
  getArrFromObjectsArr: getArrFromObjectsArr,
  getObjFromArray: getObjFromArray,
  cloneObj: cloneObj,
  sortByPropLenArray: sortByPropLenArray,
  resetObjectValues: resetObjectValues,
  getRange: getRange,

  /* -- Page 相关 -- */
  loadPagesData: loadPagesData,
  IS_CONTINUE_LOAD: IS_CONTINUE_LOAD,
  loadFonts: loadFonts,

  /* -- Configs 方法 */
  loadAllConfigs: loadAllConfigs,
  switchProcessAllConfigs: switchProcessAllConfigs,
  // refreshConfigs: refreshConfigs,
  getConfigs: getConfigs,
  initStorage: initStorage,
  getStorage: getStorage,

  /* -- 用户信息相关 -- */
  // refreshUserRoleConfigs: refreshUserRoleConfigs,
  getUserInfo: getUserInfo,
  setUserInfo: setUserInfo,
  getUserRole: getUserRole,

  /* -- 时间相关 -- */
  formatOnlyTime: formatOnlyTime,
  formatTime: formatTime,
  formatDate: formatDate,
  formatDeciTimer: formatDeciTimer,
  formatDateTime: formatDateTime,
  addTime2Object: addTime2Object,
  mergeDateTime: mergeDateTime,
  getDateFromStr: getDateFromStr,
  getMillSecsFromPeriod: getMillSecsFromPeriod,
  getTimePeriodObj: getTimePeriodObj,
  getTimePeriodPickerData: getTimePeriodPickerData,

  /* -- 方法流程 -- */
  runCallback: runCallback,

  /* -- 文件 & 路径 -- */
  getFilename: getFilename,
  getFileExtension: getFileExtension,
  extractFileInfo: extractFileInfo,

  /* -- 文字类 -- */
  isPunctuation: isPunctuation,

  /* -- 显示 & 提示 -- */
  onLoading: onLoading,
  stopLoading: stopLoading,

  /* -- 控件 -- */
  pickerMaker: pickerMaker,

  /* -- DB -- */
  ORDER: ORDER,

  /** 业务相关 */
  nextEbbingRate: nextEbbingRate,
  prevEbbingRate: prevEbbingRate,
  getGamingStatistics: getGamingStatistics,
  getTotalScore: getTotalScore,

  /* -- 时钟相关 -- */
  getDataLoadInterval: getDataLoadInterval,

}
