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
// utils.refreshConfigs(gConst.CONFIG_TAGS.COMBO_TYPE)

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShown: {
      type: Boolean,
      value: false,
    },
    hitsCount: {
      type: Number,
      value: -1
    },
    score: {
      type: Number,
      value: 1
    },
    hitsAccuScore: {
      type: Number,
      value: 0,
    },
    isCorrect: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    gConst: gConst,
    comboTypes: [],
    scoreText: '1',
    curTextCss: 'score-text',
    TextCss: {
      scoreText: 'score-text',
      comboText: 'combo-text',
      wrongText: 'wrong-text',
    },
    animMap: {
      playHits: 'playHits'
    },
  },

  lifetimes: {
    attached: function () {
      // debugLog('getPoint.lifetimes.attached', this.properties)
      let that = this
    
    },

    show: function () {
      // debugLog('getPoint.lifetimes.show')
      let that = this
    }
  },

  pageLifetimes: {
    show: function () {
      // debugLog('getPoint.pageLifetimes.show')
      let that = this
      let comboTypes = utils.getStorage(gConst.CONFIG_TAGS.COMBO_TYPE);
      // debugLog('getPoint.pageLifetimes.show.comboTypes', comboTypes)
      that.setData({
        comboTypes: comboTypes
      })
    }
  },

  observers: {
    'isShown, hitsCount, hitsAccuScore, score, isCorrect': function (isShown, hitsCount, hitsAccuScore, score, isCorrect) {
      let that = this
      if(isShown == false) return
      if (isCorrect == false) {
        // 如果答案不对
        // that.setData({
        //   isShown: false
        // })
        that.setData({
          scoreText: MSG.INCORRECT_ALERT,
          curTextCss: that.data.TextCss.wrongText,
        }, res => {
          setTimeout(() => {
            that.triggerEvent('close', 
            { hitsScore: 0, hitsClass: '', isCorrect: isCorrect })
          }, 1000)
        })
        return;
      }
      // 如果答案正确
      // debugLog('getPoint.observers.isShown', isShown)
      let scoreText = ''
      let curTextCss = ''
      let hitsScore = 0
      let hitsClass = ''
      let isHits = false
      scoreText = "+" + score.toFixed(1)
      curTextCss = that.data.TextCss.scoreText
      that.data.comboTypes.find(elem => {
        if(elem.hits == hitsCount){
          hitsClass = elem.name
          scoreText = "+" + elem.name
          hitsScore = Math.ceil(elem.value * hitsAccuScore)
          curTextCss = that.data.TextCss.comboText
        }
      })
      // debugLog('getPoint.observers.scoreText', scoreText)
      // debugLog('getPoint.observers.curTextCss', curTextCss)
      that.setData({
        scoreText: scoreText,
        curTextCss: curTextCss,
      }, res => {
        setTimeout(() => {
          that.triggerEvent('close', 
            { hitsScore: hitsScore, hitsClass: hitsClass, isCorrect: isCorrect})
        }, 1000)
      })
      
    },
  },  

  /**
   * 组件的方法列表
   */
  methods: {
    onClose: function(e){
      let that = this
      that.setData({
        isShown: false
      }, res=>{
        that.triggerEvent('close')
      })
    }
  }
})
