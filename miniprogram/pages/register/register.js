// pages/register/register.js
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
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

const userApi = require('../../api/user');
const vertifyCodes = gConst.REGISTER_VERTIFY_CODE;
const USER_ROLE_OBJS = wx.getStorageSync(gConst.USER_ROLES_LIST_KEY)
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    userRole: '学生',
    phoneNumber: '',
    isValueCorrect: gConst.valueCSS.CORRECT,
    contactName: '',
    isVertified: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // utils.refreshUserRoleConfigs(globalData)
    let userInfo = utils.getUserInfo(globalData)
    // debugLog('globalData.userInfo', userInfo);
    this.setData({ userInfo: userInfo })

    // debugLog('this.data.userInfo', this.data.userInfo)

    // debugLog('options', options)
    if (options.userRole){
      this.setData({
        userRole: options.userRole
      });
    }
    this.setData({
      contactName: this.data.userInfo.nickName
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 点击注册后创建用户
   */
  onRegister: function (e) {
    // debugLog('event', e);
    let that = this
    // Show form values
    let formValues = e.detail.value
    // debugLog('onRegister.formValue', formValues);
    var userInfo = utils.getUserInfo(globalData)
    // debugLog('userInfo', userInfo)
    formValues['userRole'] = that.data.userRole
    Object.assign(userInfo, formValues)
    delete userInfo['_openid']
    globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
    this.setData({
      userInfo: userInfo
    })
    // debugLog('userInfo', userInfo)


    let vertifyResult = utils.getUserRole(formValues.vertifyCode)
    if (vertifyResult != '') {
      // debugLog('openId', userInfo.openId)
      formValues['userRole'] = vertifyResult
      Object.assign(userInfo, formValues)
      utils.setUserInfo(userInfo, globalData)
      // create or update user
      userApi.queryUser({
        _id: userInfo.openId
      }, result => {
        // debugLog('queryUserResult', result)
        // If not found the user insert a new one.
        if (result.length <= 0) {
          userInfo = utils.getUserInfo(globalData);
          userInfo['_id'] = userInfo.openId
          userInfo['userRole'] = formValues['userRole']
          userInfo['score'] = 0
          // debugLog('create a new user', userInfo)
          userApi.createUser(userInfo, result => {
            // debugLog('insertResult', result)
            utils.setUserInfo(userInfo, globalData)
            wx.navigateBack({
              
            })
          })
        } else {
          userInfo = result[0]
          // else updat the user info with login time
          // debugLog('else updat the user info with login time','')
          // debugLog('updateUser', formValues)
          userApi.updateUser(userInfo._id,
            formValues,
            result => {
              // debugLog('updateResult', result)
              // globalData.userInfo = userInfo
              // wx.setStorageSync(storeKeys.userInfo, userInfo)
              wx.navigateBack({

              })
            })
        }

        // set storage
        let userInfo = globalData[storeKeys.userInfo]
        userInfo['userRole'] = that.data.userRole
        userInfo['contactName'] = formValues['contactName']
        userInfo['contactMobile'] = formValues['contactMobile']
        globalData[storeKeys.userInfo] = userInfo

      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '验证码不正确'
      })
      return
    }
  },

  /**
   * Reset Form
   */
  formReset: function () {

  },

  /**
   * Get phone number from weixin
   */
  getPhoneNumber: function (e) {
    // debugLog('event', e);
    let cloudId = e.detail.cloudID
    let that = this

    wx.cloud.callFunction({
      name: 'getPhoneNumber',
      data: {
        phoneNumber: wx.cloud.CloudID(cloudId),
        obj: {
          shareInfo: wx.cloud.CloudID(cloudId),
        }
      }
      , success: res => {
        // debugLog('getPhoneNumber', res)
        that.setData({
          phoneNumber: res.result.phoneNumber
        })

      },
      fail: err => {
        // console.error('[云函数] [login] 调用失败', err)
      }
    })
  },


  

  formReset: function () {
    console.log('form发生了reset事件')
  },

})