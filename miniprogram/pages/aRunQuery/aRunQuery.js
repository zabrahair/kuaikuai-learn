const app = getApp()
const globalData = app.globalData

const MSG = require('../../const/message.js')
const debugLog = require('../../utils/log.js').debug;
const errorLog = require('../../utils/log.js').error;
const gConst = require('../../const/global.js');
const storeKeys = require('../../const/global.js').storageKeys;
const utils = require('../../utils/util.js');
const TABLES = require('../../const/collections.js')

//Api
const learnHistoryApi = require('../../api/learnHistory.js')

const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command
Page({

  /**
   * 页面的初始数据
   */
  data: {
    functionsIdx: 0,
    functions: ['CountRepeated', 'EbbingCount'
              , 'Update', 'AppendBatchWords',
                'FindRepeated','EbbingQuestions'],
    funcName: 'CountRepeated',
    table: 'chinese-words',
    where: '',
    update: "小学三年级下，自助默写，默写卡，拼写",
    result: '',
    // Chinese Meaning
    isShownChineseMeaning: false,
    word: '同舟共济',
    // word: '商量',

    // myQcodeDialog
    isShownMyQcode: false,

    // statisticDialog
    isShownStatisticDialog: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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

  submitAnswer: function(e){
    let that = this
    let detail = utils.getEventDetailValue(e)
    let functionName = that.data.funcName
    let tablerName = detail.tablerName
    let pWhere = detail.where
    let pUpdate = detail.update
 //   debugLog('Now Fucntion', functionName)
    let ebbingRates = utils.getConfigs(gConst.CONFIG_TAGS.EBBINGHAUS_RATES)
    switch (functionName){
      case 'AppendBatchWords':
        /* test add chinese batch */
        let wordsAll = detail.where
        let wordsArray = wordsAll.split('\n')
        // debugLog('wordsArray', wordsArray)
        let tags = detail.update
        // let insertTimer
        for (let i in wordsArray) {
          // debugLog('i',i)
          setTimeout(() => {
            wx.cloud.callFunction({
              // name: form.functionName,
              name: functionName,
              data: {
                table: tablerName,
                words: wordsArray[i],
                tags: tags,//姐姐妹妹，人物描写，《作文工具书》
                otherSegs: {
                  "注音": "",
                  "meaning": "",
                  "反义词": [],
                  "近义词": [],
                  "量词": "",
                  "score": 1.0,
                  "minFinishTime": 20000.0,
                }
              },
              success: res => {
             //   debugLog('appendBatchWords.res', res)
                that.setData({
                  result: JSON.stringify(res, null, 4)
                })
              },
              fail: err => {
                console.error('【云函数】【AppendBatchWords】调用失败', err.stack)
                that.setData({
                  result: JSON.stringify(res, null, 4)
                    .replace(/\n/gi, '<br/>')
                    .replace(/\s/gi, '&nbsp;')
                })
              }
            })
          }, 300 * i)
        }
        break;

      case 'Update':
        wx.cloud.callFunction({
          name: functionName,
          data: {
            table: tablerName,
            where: {
              tags: _.all(['第二课 小燕子', '老师划', '小学三年级下', '自助默写', '默写卡', '拼写']),
            },
            update: {
              tags: _.pull('第二课 小燕子')
            }
          },
          success: res => {
         //   debugLog('Update.res', res)
            that.setData({
              result: JSON.stringify(res, null, 4)
                .replace(/\n/gi, '<br/>')
                .replace(/\s/gi, '&nbsp;')
            })
          },
          fail: err => {
            console.error('【云函数】【 Update 】调用失败', err)
          }
        })
        break;
      case 'CountRepeated':
        wx.cloud.callFunction({
          name: 'CountRepeated',
          data: {
            table: tablerName,
            limit: 20,
            pageIdx: 0
          },
          success: res => {
            that.setData({
              result: JSON.stringify(res, null, 4)
                .replace(/\n/gi, '<br/>')
                .replace(/\s/gi, '&nbsp;')
            })
         //   debugLog('FindRepeated.list.length', res.result.list.length)
         //   debugLog('FindRepeated.list', res.result.list)
          },
          fail: err => {
            console.error('【云函数】【 Update 】调用失败', err)
          }
        })
        break;
      case 'FindRepeated':
        wx.cloud.callFunction({
          name: 'CountRepeated',
          data: {
            table: tablerName,
            limit: 20,
            pageIdx: 0
          },
          success: res => {
         //   debugLog('FindRepeated.list.length', res.result.list.length)
         //   debugLog('FindRepeated.list', res.result.list)
          },
          fail: err => {
            console.error('【云函数】【 Update 】调用失败', err)
          }
        })
        for (let i=0; i < 1; i++){
          setTimeout(() => {
            wx.cloud.callFunction({
              name: functionName,
              data: {
                table: tablerName,
                limit: 20,
                pageIdx: 0
              },
              success: res => {
                that.setData({
                  result: JSON.stringify(res, null, 4)
                    .replace(/\n/gi, '<br/>')
                    .replace(/\s/gi, '&nbsp;')
                })
             //   debugLog('FindRepeated.list.length', res.result.list.length)
                // debugLog('FindRepeated.list', res.result.list)
                // debugLog('FindRepeated.updateResults', res.result.updateResults)
             //   debugLog('FindRepeated.updateResults.length', res.result.updateResults.length)
                // debugLog('FindRepeated.removeResults', res.result.removeResults)
             //   debugLog('FindRepeated.removeResults.length', res.result.removeResults.length)
              },
              fail: err => {
                console.error('【云函数】【 Update 】调用失败', err)
              }
            })
          }, 3000 * i )
        }
        wx.cloud.callFunction({
          name: 'CountRepeated',
          data: {
            table: tablerName,
            limit: 20,
            pageIdx: 0
          },
          success: res => {
         //   debugLog('FindRepeated.list.length', res.result.list.length)
         //   debugLog('FindRepeated.list', res.result.list)
          },
          fail: err => {
            console.error('【云函数】【 Update 】调用失败', err)
          }
        })
        break;
      case 'EbbingCount':
        learnHistoryApi.countEbbinghaus({}, ebbingRates[0], 0, res=>{
       //   debugLog('countEbbinghaus.intime.res', res)
          that.setData({
            result: res
          })
        }, learnHistoryApi.EBBING_STAT_MODE.IN_TIME)
        learnHistoryApi.countEbbinghaus({}, ebbingRates[0], 0, res => {
       //   debugLog('countEbbinghaus.timeout.res', res)
          that.setData({
            result: JSON.stringify(res, null, 4)
              .replace(/\n/gi, '<br/>')
              .replace(/\s/gi, '&nbsp;')
          })
        }, learnHistoryApi.EBBING_STAT_MODE.TIMEOUT)
        break;
      case 'EbbingQuestions':
        learnHistoryApi.getEbbinghausQuestions({}, ebbingRates[0], 0, res => {
       //   debugLog('countEbbinghaus.intime.res', res)
          that.setData({
            result: JSON.stringify(res, null, 4)
              .replace(/\n/gi, '<br/>')
              .replace(/\s/gi, '&nbsp;')
          })
        }, learnHistoryApi.EBBING_STAT_MODE.IN_TIME)
        learnHistoryApi.getEbbinghausQuestions({}, ebbingRates[0], 0, res => {
       //   debugLog('countEbbinghaus.timeout.res', res)
          that.setData({
            result: result + "<br/>" + JSON.stringify(res, null, 4)
              .replace(/\n/gi, '<br/>')
              .replace(/\s/gi, '&nbsp;')
          })
        }, learnHistoryApi.EBBING_STAT_MODE.TIMEOUT)
        break;
      default:
    }


    /* test start */
    // debugLog('submitAnswer.e',e)
    // let form = utils.getEventDetailValue(e)
    // debugLog('submitAnswer.form', form)
    // let where = JSON.parse(form.where)
    // let update = JSON.parse(form.update)
    // debugLog('submitAnswer.form.functionName', form.functionName)
    // debugLog('submitAnswer.where', where)
    // debugLog('submitAnswer.update', update)
    // wx.cloud.callFunction({
    //   // name: form.functionName,
    //   name: 'Aggregate',
    //   data: {
    //     table: 'aaaa',
    //     where: {a:1},
    //     update: { a: 1 },
    //     pageIdx: 0
    //   },
    //   success: res => {
    //     debugLog(form.functionName+'.res', res.result.list)
    //     debugLog(form.functionName + '.res.length', res.result.list.length)
    //   },
    //   fail: err => {
    //     console.error('[云函数] ['+form.functionName+'] 调用失败', err)
    //   }
    // })
    /* test start */
    // db.collection("learn-history").where({
    //   question:{
    //     tags: _.in(["3 Hits"])
    //   }
    // }).get().then(res=>{
    //   debugLog('res', res);
    // })
    // //   {
    // //   // data: {
    // //   //   question: {
    // //   //     tags:  _.pull("")
    // //   //   }
    // //   // },
    // //   success: res => {
    // //     let result = res;
    // //     debugLog('[数据库' + table + '][更新记录]成功', result);

    // //   },
    // //   fail: err => {
    // //     wx.showToast({
    // //       icon: 'none',
    // //       title: '更新记录失败'
    // //     })
    // //     errorLog('[数据库' + table + '][更新记录]失败', err)
    // //   }
    // // })
  },

  resetAnswer: function(e){

  },

  /**
   *  过滤下拉框事件
   */
  onFilterActions: function (e) {
    let that = this
    let value = utils.getEventDetailValue(e)
    let dataset = utils.getEventDataset(e)
    let filterType = dataset.filterType
    switch (filterType) {
      case 'funcName':
        let funcName = that.data.functions[value]
        that.setData({
          funcName: funcName,
          functionsIdx: value,
        })
        break;
      default:

    }

  },

  /**
   * 关闭显示得分层
   */
  closeChineseMeaning: function(params) {
    let that = this
    that.setData({
      isShownChineseMeaning: false
    })
  }

})
