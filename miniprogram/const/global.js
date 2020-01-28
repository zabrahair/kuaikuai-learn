const UNSELECT = 'unselected';
const SELECTED = 'selected';
const storageKeys = {
  userInfo: 'userInfo'
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
  WEEK_DAYS: WEEK_DAYS
}