
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
  // USER_ROLE & 验证码
  USER_ROLES_OBJS_KEY: 'USER_ROLES_OBJS',
  USER_ROLES_KEY: 'USER_ROLES',
  VERTIFY_CODE_KEY: 'REGISTER_VERTIFY_CODE',
  // icons relate
  FAVORITED_ICON: '/images/favorited.png',
  NOT_FAVORITED_ICON: '/images/not-favorited.png',
  ANSWER_CORRECT: '/images/correct.png',
  ANSWER_INCORRECT: '/images/incorrect.png',
  GAME_START_ICON: '/images/game_start.png',
  ERROR_ICON: '/images/error.png',
  EXP_ICON: '/images/exp.png',
  THINK_ICON: '/images/think.png',
  ALERT_ICON: '/images/alert.png',
  SCORE_ICON: '/images/score.png',
  TOTAL_EXP_ICON: '/images/totalExp.png',
  FILTERS_ICON: '/images/filters.png',
  SEARCH_ICON: '/images/search.png',
  GOTO_HOVER_ICON: '/images/goto-hover.png',
  GOTO_ICON: '/images/goto.png',
  PREVIOUS_ICON: '/images/previous.png',
  NEXT_ICON: '/images/next.png',
  RESET_ICON: '/images/reset.png',
  PAUSE_ICON: '/images/pause.png',
  SUBMIT_ICON: '/images/submit.png',
  CORRECT_ANSWER_ICON: '/images/correct_answer.png',
  INCORRECT_ANSWER_ICON: '/images/incorrect_answer.png',
  SOUND_ICON: '/images/sound.png',
  THINKING_ICON: '/images/thinking.png',
  INVISIBILITY_ICON: '/images/invisibility.png',
  VISIBILITY_ICON: '/images/visibility.png',
  DICT_ICON: '/images/dict.png',
  // 背景
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
    // WRONG: 'WRONG',
    // NORMAL: 'NORMAL',
    // SLOW: 'SLOW',
    // WRONG_SLOW: 'WRONG_SLOW',
    // FAVORITES: 'FAVORITES',
    HISTORY: '做过的题',
    CORRECT: '正确的题',
    WRONG: '错题',
    NORMAL: '常规',
    SLOW: '慢速',
    WRONG_SLOW: '错而慢',
    FAVORITES: '收藏',
    EBBINGHAUS: '艾宾浩斯',
  },
  DEFAULT_USER_CONFIGS: {
    divideSpeedFloor: 4000,
    // filterQuesLastDays: 1,
    filterQuesLastDate: new Date().toLocaleDateString('zh-CN', DEFAULT_DATE_FORMAT_OPTIONS).replace(/\//g, '-'),
    filterQuesLastTime: '23:59'
  },
  DEFAULT_DATE_FORMAT_OPTIONS: DEFAULT_DATE_FORMAT_OPTIONS,
  IS_FAVORITED: '收藏',
  ANSWER_TYPES: {
    SELF_RECITE: '自助默写',
    MANUAL_CHECK: '默写卡',
    SPELLING: '拼写',
    OPTIONS_SELECT: '选择题',
    FILL_BLANK: '填空题',
    RICITE_ARTICLE: '背文章',
    CONNECT_ITEMS: '连线题',
  },
  TAGS_LOCATION: {
    NORMAL: 'NORMAL',
    FAVORITES: 'FAVORITES',
    HISTORY: 'HISTORY',
    CORRECT_HISTORY: 'CORRECT_HISTORY',
    WRONG_HISTORY: 'WRONG_HISTORY',
  },
  CONFIG_TAGS: {
    USER_ROLE_TAG: 'USER_ROLE',
    ANSWER_TYPE: 'ANSWER_TYPE',
    SYSTEM_CONFIG: 'SYSTEM_CONFIG',
    COMBO_TYPE: 'COMBO_TYPE',
    TASK_STATUS: 'TASK_STATUS',
    BONUS_CLASSES: 'BONUS_CLASSES',
    EBBINGHAUS_CLASSES: 'EBBINGHAUS_CLASSES',
    EBBINGHAUS_RATES: 'EBBINGHAUS_RATES',
  },
  DICT_SEARCH_MODE: {
    WORD: 'WORD',
    CHAR: 'CHAR',
  },
  TOAST_DURATION_TIME: 1000,
  LANGS: {
    CHINESE: 'zh_CN',
    ENGLISH: 'en_US'
  }
}
