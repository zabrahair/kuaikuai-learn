const debugLog = require('./log.js').debug;
const errorLog = require('./log.js').error;

const MAP = {
  // 拼写卡翻到反面
  TURN_OVER_SPELL_CARD: {
    name: 'TURN_OVER_SPELL_CARD',
    animName: "turnOverSpellCard",
    options: {
      duration: 1000,
      timingFunction: 'ease-out',
      rotateY: 180,
      opacity: 1,
    }
  },
  // 拼写卡翻到正面
  TURN_BACK_SPELL_CARD: {
    name: 'TURN_BACK_SPELL_CARD',
    animName: "turnOverSpellCard",
    options: {
      duration: 1000,
      timingFunction: 'ease-out',
      rotateY: 0,
      // opacity: 0,
    }
  },
  // 继续按钮出现
  FADE_OUT_CONTINUE_BTN: {
    name: 'FADE_OUT_CONTINUE_BTN',
    animName: 'fadeInOutContinueBtn',
    options: {
      duration: 1000,
      timingFunction: 'ease-in',
      rotateY: 0,
      opacity: 1,
    }
  },
  // 继续按钮消失
  FADE_IN_CONTINUE_BTN: {
    name: 'FADE_IN_CONTINUE_BTN',
    animName: 'fadeInOutContinueBtn',
    options: {
      duration: 1,
      timingFunction: 'ease-in',
      rotateY: 0,
      opacity: 0,
    }
  },
  // 题卡消失
  FADE_IN_QUESTION_BLOCK: {
    name: 'FADE_IN_QUESTION_BLOCK',
    animName: 'fadeInOutQuestionBlock',
    options: {
      duration: 1000,
      timingFunction: 'ease-in',
      rotateY: 180,
      opacity: 0,
    }
  },
  // 题卡出现
  FADE_OUT_QUESTION_BLOCK: {
    name: 'FADE_OUT_QUESTION_BLOCK',
    animName: 'fadeInOutQuestionBlock',
    options: {
      duration: 1000,
      timingFunction: 'ease-out',
      rotateY: 0,
      opacity: 1,
    }
  },
  // 打开对话框效果
  OPEN_DIALOG: {
    name: 'OPEN_DIALOG',
    animName: 'switchDialogStatus',
    options: {
      duration: 1000,
      timingFunction: 'ease-out',
      height: "100vh",
      opacity: 1,
    }
  },
  // 关闭对话框效果
  CLOSE_DIALOG: {
    name: 'CLOSE_DIALOG',
    animName: 'switchDialogStatus',
    options: {
      duration: 1000,
      timingFunction: 'ease-out',
      height: "0vh",
      opacity: 0,
    }
  },
}

/**
 * 关闭对话框效果
 */
const playSwitchDialog = function(that, name, pOptions, callback){
  if (!pOptions) {
    pOptions = {}
  }
  // debugLog('playFade.name', name)
  // debugLog('playFade.pOptions', pOptions)
  let finalOptions = Object.assign(pOptions, MAP[name].options)
  let option = {
    duration: finalOptions.duration, // 动画执行时间
    timingFunction: finalOptions.timingFunction // 动画执行效果
  };
  // debugLog('playFade.finalOptions', finalOptions)
  var switchDialog = wx.createAnimation(option)
  switchDialog.height(finalOptions.height);
  switchDialog.opacity(finalOptions.opacity).step();
  that.setData({
    [MAP[name].animName]: switchDialog.export(),// 开始执行动画
  }, function () {
    if (callback) {
      setTimeout(()=>{
        callback()
      }, finalOptions.duration*0.9)
    }
  })  
}

/**
 * 动画效果
 */
const playFade = function (that, name, pOptions, callback) {
  if (!pOptions) {
    pOptions = {}
  }
  // debugLog('playFade.name', name)
  // debugLog('playFade.pOptions', pOptions)
  let finalOptions = Object.assign(pOptions, MAP[name].options)
  let option = {
    duration: finalOptions.duration, // 动画执行时间
    timingFunction: finalOptions.timingFunction // 动画执行效果
  };
  // debugLog('playFade.finalOptions', finalOptions)
  var fadeInOut = wx.createAnimation(option)
  fadeInOut.rotateY(finalOptions.rotateY);
  // moveOne.translateX('100vw');
  fadeInOut.opacity(finalOptions.opacity).step();
  that.setData({
    [MAP[name].animName]: fadeInOut.export(),// 开始执行动画
  }, function () {
    if (callback) {
      callback()
    };
  })
}

module.exports = {
  MAP: MAP,
  playFade: playFade,
  playSwitchDialog: playSwitchDialog,
}