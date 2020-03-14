function loadPagesData_FunctionInvokeSample(){
  let all = []
  utils.loadPagesData((pageIdx, loadTimer, isContinue) => {
    wx.cloud.callFunction({
      name: 'Query',
      data: {
      },
      success: res => {
        try {
          if (list.length && list.length > 0) {
            // 只有确认还有数据才继续调用接口加载
            // 之所以不能赋值是因为我们要保持isContinue原先指向的指针
            Object.assign(isContinue, utils.IS_CONTINUE_LOAD.TRUE)
            // 每次有数据就添加到总列表中
            all = all.concat(list)
            that.setData({
              all: all,
            }, function () {
              if (pageIdx == 0) {
                // 连续加载的首条记录
              }
            })
          } else {
            // 加载完成，结束时钟
            clearInterval(loadTimer)
            
          }
        } catch (e) {
          clearInterval(loadTimer)
          wx.showToast({
            image: gConst.ERROR_ICON,
            title: MSG.SOME_EXCEPTION,
            duration: 1000,
          })
        }
      },
      fail: err => {
        // errorLog('[云函数] 调用失败：', err)
        clearInterval(loadTimer)
        wx.showToast({
          image: gConst.ERROR_ICON,
          title: MSG.SOME_EXCEPTION,
          duration: 1000,
        })
      }
    })
  }, utils.getDataLoadInterval())
}

function loadPagesData_ApiInvokeSample(){
  utils.loadPagesData((pageIdx, loadTimer, isContinue) => {
    learnHistoryApi.getEbbinghausQuestions({
      table: tableValue,
      question: {
        // tags: '默写卡'
      },
    }
      , curEbbingRate
      , pageIdx
      , list => {
        // debugLog('list', list)
        try {
          if (list.length && list.length > 0) {
            // 只有确认还有数据才继续调用接口加载
            // 之所以不能赋值是因为我们要保持isContinue原先指向的指针
            Object.assign(isContinue, utils.IS_CONTINUE_LOAD.TRUE)
            // 每次有数据就添加到总列表中

          } else {
            // 加载完成，结束时钟
            clearInterval(loadTimer)
          }
        } catch (e) {
          // 出现异常就停止加载
          clearInterval(loadTimer)
          wx.showToast({
            image: gConst.ERROR_ICON,
            title: MSG.SOME_EXCEPTION,
            duration: 1000,
          })
        }
      },
      ebbingStatMode)
  }, utils.getDataLoadInterval())
}

module.exports = {
  loadPagesData_FunctionInvokeSample: loadPagesData_FunctionInvokeSample,
  loadPagesData_ApiInvokeSample: loadPagesData_ApiInvokeSample
}