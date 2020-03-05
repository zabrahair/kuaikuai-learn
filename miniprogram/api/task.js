const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const TABLE = TABLES.TASK;
const dbApi = require('db.js')

function create(pInsertBody, callback) {
  let insertBody = {}
  Object.assign(insertBody, pInsertBody)
  // 根据条件插入所有用户
  dbApi.create(TABLE, insertBody, res=>{
    // debugLog('taskApi.create.res', res)
    callback(res)
  })
}

function query(pWhere, pageIdx, callback) {
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  const _ = db.command
  let where = pWhere
  let perPageCount = 20
  // debugLog('tableName', tableName)
  // debugLog('where', where)
  db.collection(TABLE)
    .where(pWhere)
    .skip(pageIdx * perPageCount)
    .limit(perPageCount)
    .orderBy('updateTime', 'desc')
    .orderBy('createTime', 'desc')
    .get()
    .then(res => {
      // debugLog('queryPages', res)
      // debugLog('queryPages.length', res.data.length)
      if (res.data.length > 0) {
        utils.runCallback(callback)(res.data, pageIdx)
        return
      } else {
        utils.runCallback(callback)([], pageIdx)
      }
    })
    .catch(err => {
      utils.runCallback(callback)(null, pageIdx)
    })
}

function update(id, pUpdateObj, callback) {
  let updateObj = {}
  Object.assign(updateObj, pUpdateObj)
  dbApi.update(TABLE, id, updateObj, res=>{
    callback(res)
  })
}

function cloudWhereUpdate(pWhere, pUpdateObj, callback) {
  let updateObj = pUpdateObj
  let where = pWhere
  Object.assign(updateObj, pUpdateObj)
  dbApi.cloudWhereUpdate(TABLE, pWhere, updateObj, res => {
    utils.runCallback(callback)(res)
  })
}

module.exports = {
  query: query,
  update: update,
  cloudWhereUpdate: cloudWhereUpdate,
  create: create,
}
