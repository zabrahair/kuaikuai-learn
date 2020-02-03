const DEFAULT_DATE_FORMAT_OPTIONS = { year: 'numeric', month: '2-digit', day: '2-digit' };
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
  // icons relate
  ANSWER_CORRECT: '/images/correct.png',
  ANSWER_INCORRECT: '/images/incorrect.png',
  GAME_START_ICON: '/images/game_start.png',
  ERROR_ICON: '/images/error.png',
  EXP_ICON: '/images/exp.png',
  THINK_ICON: '/images/think.png',
  ALERT_ICON: '/images/alert.png',
  SCORE_ICON: '/images/score.png',
  FILTERS_ICON: '/images/filters.png',
  SEARCH_ICON: '/images/search.png',
  DEFAULT_BACKGROUND: 'https://6b75-kuaikuai-fjpqg-1301178064.tcb.qcloud.la/kuai_background.jpg?sign=4c4590afa901625789b285cf1285cc4b&t=1580309905',
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
  GAME_MODE: {
    WRONG: 'WRONG',
    NORMAL: 'NORMAL',
    SLOW: 'SLOW',
    WRONG_SLOW: 'WRONG_SLOW'
  },
  DEFAULT_USER_CONFIGS: {
    divideSpeedFloor: 4000,
    // filterQuesLastDays: 1,
    filterQuesLastDate: new Date().toLocaleDateString('zh-CN', DEFAULT_DATE_FORMAT_OPTIONS).replace(/\//g, '-'),
    filterQuesLastTime: '23:59'
  },
  DEFAULT_DATE_FORMAT_OPTIONS: DEFAULT_DATE_FORMAT_OPTIONS
}