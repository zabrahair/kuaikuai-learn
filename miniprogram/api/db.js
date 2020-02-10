const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command

function queryPages(tableName, pWhere, pageIdx, callback){
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('where', where)
  db.collection(tableName)
    .where(pWhere)
    .skip(pageIdx * perPageCount)
    .get()
    .then
    (res => {
      debugLog('queryPages', res)
      debugLog('queryPages.length', res.data.length)
      if (res.data.length > 0) {
        callback(res.data, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
}

const query = function (table, filters, callback) {

  // 根据条件查询所有Records
  db.collection(table).where(filters).get({
    success: res => {
      let result = res.data;
      // debugLog('[数据库' + table + '][查询记录]', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '查询记录失败'
      })
      errorLog('[数据库' + table + '][查询记录] 失败：', err)
    }
  })
}

const create = function (table, insertData, callback) {
  insertData = Object.assign(insertData, {
    _id: insertData.openId
  })
  let now = new Date();
  let nowTimeString = utils.formatTime(now);

  Object.assign(insertData, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  // debugLog('insertData', insertData)
  // 根据条件插入所有Records
  db.collection(table).add({
    data: insertData,
    success: res => {
      let result = res;
      // debugLog('[数据库' + table + '][插入记录]成功', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '插入记录失败'
      })
      errorLog('[数据库' + table + '][插入记录]失败', err)
    }
  })
}

const update = function (table, id, updateObj, callback) {
  let now = new Date();
  let nowTimeString = utils.formatTime(now);

  Object.assign(updateObj, {
    updateTimestamp: now.getTime(),
    updateLocalTime: nowTimeString
  })
  delete updateObj._id
  // debugLog('id', id)
  // debugLog('updateObj', updateObj)
  // 根据条件更新所有Records
  db.collection(table).doc(id).update({
    data: updateObj,
    success: res => {
      let result = res;
      // debugLog('[数据库' + table + '][更新记录]成功', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '更新记录失败'
      })
      errorLog('[数据库' + table + '][更新记录]失败', err)
    }
  })
}

const groupAggregate = function (table, matchObj, unwindObj, groupObj, projectObj, callback) {
  db.collection(table)
    .aggregate()
    .match(matchObj)
    .unwind(unwindObj)
    .group(groupObj)
    .project(projectObj)
    .end().then(res => {
      // debugLog('groupAggregate[' + table + ']', res)
      callback(res)
    })
}

function getTags(tableName, pWhere, pageIdx, callback) {
  // debugLog('tableName', tableName)
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('where', where)
  db.collection(tableName)
    .aggregate()
    .unwind('$tags')
    .group({
      _id: '$tags',
      count: $.sum(1)
    })
    .skip(pageIdx * perPageCount)
    .end()
    .then
    (res => {
      // debugLog('getTags', res)
      // debugLog('getTags.length', res.list.length)
      if (res.list.length > 0) {
        let tags = []
        for (let i in res.list) {
          tags.push({
            text: res.list[i]._id
            , count: res.list[i].count
          })
        }
        callback(tags, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
}

module.exports = {
  query: query,
  create: create,
  update: update,
  groupAggregate: groupAggregate,
  queryPages: queryPages,
  getTags: getTags,
}