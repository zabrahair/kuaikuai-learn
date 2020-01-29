const UNSELECT = 'unselected';
const SELECTED = 'selected';
const storageKeys = {
  userInfo: 'userInfo',
  totalScore: 'totalScore'
}
const userInfoObj = {
  userRole: '',
  realName: '',
  userMobile: '',
  openId: '',
  appId: '',
}

const pageParams = {
  
}

const orderStatus = {
  FINISHED: '完成',
  ORDERED: '已下单',
  SHIPPING: '配送中'
}

const valueCSS = {
  CORRECT: 'value_correct',
  INCORRECT: 'value_incorrect'
}

const OPERATION = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  SELECT: 'SELECT',
  DELETE: 'DELETE'
}



const WEEK_DAYS = [
  { en: 'Sunday', abbr: 'Sun', cn: '周日' },
  { en: 'Monday', abbr: 'Mon', cn: '周一' },
  { en: 'Tuesday', abbr: 'Tue', cn: '周二' },
  { en: 'Wednesday', abbr: 'Wed', cn: '周三' },
  { en: 'Thursday', abbr: 'Thu', cn: '周四' },
  { en: 'Friday', abbr: 'Fri', cn: '周五' },
  { en: 'Saturday', abbr: 'Sat', cn: '周六' },
]

module.exports = {
  UNSELECT: UNSELECT,
  SELECTED: SELECTED,
  storageKeys: storageKeys,
  userInfoObj: userInfoObj,
  pageParams: pageParams,
  valueCSS: valueCSS,
  OPERATION: OPERATION,
  WEEK_DAYS: WEEK_DAYS,
  REGISTER_VERTIFY_CODE: {
    STUDENT: 'A48!KB',
    PARENT: 'A47!KB',
    TEACHER: 'A46!KB',
    ADMIN: 'A45!KB',
  },
  ANSWER_CORRECT: '/images/correct.png',
  ANSWER_INCORRECT: '/images/incorrect.png',
  GAME_START_ICON: '/images/game_start.png',
  ALERT_ICON: '/images/alert.png',
  SCORE_ICON: '/images/score.png',
  DEFAULT_BACKGROUND: 'https://6c61-laiqiafanfan-z3fxt-1301085811.tcb.qcloud.la/kuai/whsmhhwpny.jpeg?sign=6db6f954feb1233dc5dd55e5087cf4d9&t=1580298598',
  ANSWER_TYPE: {
    TEXT: 'text',
    DIGIT: 'digit',
  },
  TIME_UNITS: [
    { name: '毫秒', interval: 1000 }
    , { name: '秒', interval: 60 }
    , { name: '分', interval: 60 }
    , { name: '时', interval: 24 }
    , { name: '天', interval: 30 }
    , { name: '月', interval: 12 }
    , { name: '年', interval: 100 }
  ],
}