// components/singleSelectQuestion/singleSelectQuestion.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 提交做题记录
     */
    recordHistory: function (question, answer) {
      let historyRecord = {};
      historyRecord['table'] = HISTORY_TABLE
      historyRecord['question'] = question
      // delete question._id
      // Object.assign(historyRecord, question)
      Object.assign(historyRecord, answer)
      // debugLog('historyRecord', historyRecord)
      wx.cloud.callFunction({
        name: 'learnHistoryCreate',
        data: {
          hisRecord: historyRecord
        },
        success: res => {
          // debugLog('learnHistoryCreate.success.res', res)
        },
        fail: err => {
          errorLog('[云函数] 调用失败：', err)
        }
      })
    },

    /**
     * 收藏按钮点击
     */
    clickFavoriteSwitch: function (e) {
      let that = this
      debugLog('clickFavoriteSwitch.dataset', e.target.dataset)
      let dataset = e.target.dataset
      let curQuesId = dataset.curQuestionIndex

      if (that.data.isFavorited == true) {
        let curQuestion = that.data.curQuestion
        let tags = curQuestion.tags
        // delete favorite tag
        tags = tags.filter(ele => {
          return ele != gConst.IS_FAVORITED
        })
        debugLog('curQuestion tags removed', tags)
        favoritesApi.removeFavorite(TABLES.ENGLISH_WORDS, curQuestion, res => {
          that.setData({
            isFavorited: false,
            curQuestion: curQuestion,
          })
        })

      } else if (that.data.isFavorited == false) {
        // set to favorited
        let curQuestion = that.data.curQuestion
        let tags = curQuestion.tags
        if (!tags.includes(gConst.IS_FAVORITED)) {
          tags.push(gConst.IS_FAVORITED)
        }
        debugLog('curQuestion tags', tags)
        favoritesApi.createFavorite(TABLES.ENGLISH_WORDS, curQuestion, res => {
          that.setData({
            isFavorited: true,
            curQuestion: curQuestion,
          })
        })

      }
    }  
  }
})
