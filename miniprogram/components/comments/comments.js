const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const media = require('../../utils/media.js');
const TABLES = require('../../const/collections.js')
const animation = require('../../utils/animation.js');
const dialogCommon = require('../../common/dialog.js')

/* DB API */
const dbApi = require('../../api/db.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comments: {
      type: Array,
      value: null,
    },
    userInfo: {
      type: Object,
      value: null,
    },
    isShowInputArea: {
      type: Boolean,
      value: null,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    curComment: '',
    inputState: 'append',
  },
  lifetimes: {
    attached: function () {
      let that = this
    },

    show: function () {
      let that = this

    }
  },

  pageLifetimes: {
    show: function () {
      // debugLog('getPoint.pageLifetimes.show')
      let that = this

    }
  },

  observers: {
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 当输入留言内容的时候
     */
    bindCommentInputed: function (e) {
      let that = this
      let dataset = utils.getEventDataset(e)
      // debugLog('dataset', dataset)
      let content = utils.getEventDetailValue(e)
      if(content.trim() == ''){
        return
      }
      let inputState = dataset.inputState
      let comment = {
        content: content,
        author: {
          name: that.data.userInfo.contactName,
          openid: that.data.userInfo.openid,
        }
      }
      let now = new Date()
      switch(inputState){
        case 'append': 
          utils.addTime2Object('create', comment)
          break;
        case 'update':
          utils.addTime2Object('update', comment)
          break;
        default:
      }
      // debugLog('comment', comment)
      that.triggerEvent(inputState, { comment: comment })
    },
  }
})
