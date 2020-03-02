const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const debugLog = require('log.js').debug;
const errorLog = require('log.js').error;
const userApi = require('../api/user.js')

function getUserConfigs(ifRefresh, updateConfigs) {
  let config = wx.getStorageSync('userConfigs');
  config = config ? config : gConst.DEFAULT_USER_CONFIGS
  let dbUserConfigs;
  //需要去数据库刷新
  if (ifRefresh) {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo.openId) {
      userApi.getUserConfigs(userInfo.openId
        , res => {
          debugLog('getUserConfigs.res', res)
          if (!res || updateConfigs) {
            // no user configs in db
            // create a user configs object in db
            if (updateConfigs) {
              Object.assign(config, updateConfigs)
            }
            wx.setStorageSync('userConfigs', config);
            userApi.updateUserConfigs(
              userInfo.openId
              , config
              , res => {
                debugLog('getUserConfigs.updateUserConfigs.res', res);
              })
          } else {
            // user configs exists in db
            dbUserConfigs = res;
            wx.setStorageSync('userConfigs', dbUserConfigs);
          }
        })

    }
  } else {
    // 不需要从数据库刷新，从Storage取
    return config
  }
}

module.exports = {
  getUserConfigs: getUserConfigs,
}