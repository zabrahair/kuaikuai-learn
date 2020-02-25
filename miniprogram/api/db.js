const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');

function queryPages(tableName, pWhere, pageIdx, callback){
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('tableName', tableName)
  // debugLog('where', where)
  db.collection(tableName)
    .where(pWhere)
    .skip(pageIdx * perPageCount)
    .limit(perPageCount)
    .get()
    .then(res => {
      // debugLog('queryPages', res)
      // debugLog('queryPages.length', res.data.length)
      if (res.data.length > 0) {
        callback(res.data, pageIdx)
        return
      } else {
        callback([], pageIdx)
      }
    })
    .catch(err=>{
      callback(null, pageIdx)
    })
}

const query = function (table, filters, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
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
      errorLog('[查询记录] 失败：', err.stack)
    }
  })
}

function create(table, insertData, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
  let now = new Date();
  let nowTimeString = utils.formatTime(now);

  Object.assign(insertData, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  delete insertData._id
  // debugLog('insertData', insertData)
  // 根据条件插入所有Records
  db.collection(table).add({
    data: insertData,
    success: res => {
      let result = res;
      // debugLog('[插入记录]成功', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '插入记录失败'
      })
      errorLog('[插入记录]失败', err.stack)
    }
  })
}

function update(table, id, updateObj, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command

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
      errorLog('[更新记录]失败', err.stack)
    }
  })
}

function whereUpdate(table, pWhere, updateObj, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
  let where = pWhere
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
  db.collection(table)
    .where(where)
    .update({
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
      errorLog('[更新记录]失败', err.stack)
    }
  })
}

function groupAggregate(table, matchObj, unwindObj, groupObj, projectObj, pageIdx, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
  let perPageCount = 20
  db.collection(table)
    .aggregate()
    .match(matchObj)
    .unwind(unwindObj)
    .group(groupObj)
    .project(projectObj)
    .skip(pageIdx * perPageCount)
    .end()
    .then(res => {
      // debugLog('groupAggregate[' + table + ']', res)
      callback(res, pageIdx)
    })
    .catch(err => console.error(err))
}

function getTags(tableName, pWhere, pageIdx, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command

  // debugLog('tableName', tableName)
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = pWhere
  // debugLog('where', where)
  db.collection(tableName)
    .aggregate()
    .match(pWhere)
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

function cloudWhereUpdate(pTable, pWhere, pUpdateObj, callback){
  let table = pTable
  let where = pWhere
  let now = new Date();
  let nowTimeString = utils.formatTime(now);
  let updateObj = pUpdateObj
  Object.assign(updateObj, {
    updateTimestamp: now.getTime(),
    updateLocalTime: nowTimeString
  })
  delete updateObj._id
  wx.cloud.callFunction({
    name: 'Update',
    data: {
      table: table,
      where: where,
      update: updateObj
    },
    success: res => {utils.runCallback(callback)(res) },
    fail: err => { utils.runCallback(callback)(null)}
  })
}

module.exports = {
  query: query,
  create: create,
  update: update,
  whereUpdate: whereUpdate,
  cloudWhereUpdate: cloudWhereUpdate,
  groupAggregate: groupAggregate,
  queryPages: queryPages,
  getTags: getTags,
}