const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')
const animation = require('../../utils/animation.js');
const dialogCommon = require('../../common/dialog.js')
const relationCommon = require('../../common/relationship.js')
const dbApi = require('../../api/db.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: dialogCommon.defaultDialogProperties({
    options: {
      type: Object,
      value: null,
    },
  }),

  /**
   * 组件的初始数据
   */
  data: dialogCommon.defaultDialogData({

  }),
  lifetimes: {
    attached: function () {
      let that = this
      relationCommon.initCreator(that)
    },
    show: function () {
      let that = this
      // debugLog('lifetimes.show')
      relationCommon.initCreator(that)
    }
  },
  pageLifetimes: {
    show: function () {
      // debugLog('pageLifetimes.show')
    }
  },
  observers: {
    'isShown, options': function (isShown, options) {
      let that = this
      dialogCommon.whenIsShown(that, () => {
        // debugLog('observers.isShown', isShown)
     //   debugLog('options', options)
        relationCommon.whenIsShown(that)
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 选择关系建立的身份
     */
    selectRelationship: function(e){
      let that = this
      let idx = utils.getEventDetailValue(e)
      let userRole = that.data.USER_ROLES[idx]
      delete userRole._id
      delete userRole.vertifyCode
      // debugLog('userRole', userRole)
      let curRelationship = that.data.curRelationship
      curRelationship.userRole = userRole
      that.setData({
        curRelationship: curRelationship
      })

    },

    /**
     * 输入框事件
     */
    bindInputBlur: function(e){
      let that = this
      let value = utils.getEventDetailValue(e)
      let dataset = utils.getEventDataset(e)
      let contentType = dataset.contentType
      let curRelationship = that.data.curRelationship
      switch (contentType){
        case 'nickName':
          curRelationship.nickName = value
          break;
        case 'openId':
          curRelationship.openid = value
          break;
        case 'name':
          curRelationship.name = value
          break;
        default:
          that.setData({
            curRelationship: curRelationship
          })
      }

    },

    /**
     * 功能按钮路由
     */
    onTapActions: function(e){
      let that = this
      let dataset = utils.getEventDataset(e)
      let actionType = dataset.actionType
      switch(actionType){
        case 'save':
          relationCommon.updateRelationship(
            that,
            userInfo=>{
           //   debugLog('on close')
              dialogCommon.onClose(null, that)
          })
          break;
        default:
      }
    },

    /**
     * 关闭对话框
     */
    onClose: dialogCommon.onClose,
  }
})
