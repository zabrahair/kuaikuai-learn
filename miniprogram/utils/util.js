
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const debugLog = require('log.js').debug;
const errorLog = require('log.js').error;
const userApi = require('../api/user.js')

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function mergeDateTime(dateStr, timeStr){
  let date = new Date(dateStr + 'T' + timeStr + ':00Z');
  date.setHours(date.getHours() - 8)
  // debugLog('bindLastDateChange.date', date)
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
          wx.setStorageSync(storeKeys.totalScore, res.result.score)
          callback(res.result)
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

function getUserConfigs(ifRefresh, updateConfigs){
  let config = wx.getStorageSync('userConfigs');
  config = config ? config : gConst.DEFAULT_USER_CONFIGS
  let dbUserConfigs;
  //需要去数据库刷新
  if (ifRefresh){
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo.openId){
       userApi.getUserConfigs(userInfo.openId
        ,res=>{
          debugLog('getUserConfigs.res', res)
          if (!res || updateConfigs){
            // no user configs in db
            // create a user configs object in db
            if (updateConfigs){
              Object.assign(config, updateConfigs)
            }
            wx.setStorageSync('userConfigs', config);
            userApi.updateUserConfigs(
              userInfo.openId
              , config
              , res=>{
                debugLog('getUserConfigs.updateUserConfigs.res', res);
              })  
          }else{
            // user configs exists in db
            dbUserConfigs = res;
            wx.setStorageSync('userConfigs', dbUserConfigs);
          }
        })
      
    }
  }else{
  // 不需要从数据库刷新，从Storage取
    return config
  }
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
    tags: configsApi.USER_ROLE_TAG
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
 * 刷新用户角色
 */
function refreshConfigs(configGroupTag) {
  const configsApi = require('../api/configs.js')
  let pageIdx = 0
  let dataLoadTimer = null
  clearInterval(dataLoadTimer)
  dataLoadTimer = setInterval(function () {
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
        wx.setStorageSync(configGroupTag, configsLoaded)
      } else {
        clearInterval(dataLoadTimer)
      }
    })
    pageIdx++
  }, 1000)
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

module.exports = {
  /** 工具型方法 */
  formatTime: formatTime,
  formatDate: formatDate,
  formatDeciTimer: formatDeciTimer,
  mergeDateTime: mergeDateTime,
  resetStatus: resetStatus,
  cloneObj: cloneObj,
  pickerMaker: pickerMaker,
  extractFileInfo: extractFileInfo,
  arrayJoin: arrayJoin,
  getArrFromObjectsArr: getArrFromObjectsArr,
  ORDER: ORDER,
  sortByPropLenArray: sortByPropLenArray,

  /** 功能型方法 */
  refreshUserRoleConfigs: refreshUserRoleConfigs,
  refreshConfigs: refreshConfigs,
  getGamingStatistics: getGamingStatistics,
  getUserConfigs: getUserConfigs,
  getUserRole: getUserRole,
  getTotalScore: getTotalScore,
  getUserInfo: getUserInfo,
  setUserInfo: setUserInfo,

}
