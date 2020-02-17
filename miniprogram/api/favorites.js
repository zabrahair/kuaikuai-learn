const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');
const TABLES = require('../const/collections.js');
const dbApi = require('db.js')

const db = wx.cloud.database()
const $ = db.command.aggregate
const _ = db.command
const TABLE = TABLES.FAVORITES

const createFavorite = function (tableName, insertData, callback) {
  const db = wx.cloud.database()
  let favorite = {
    table: tableName,
    thing: insertData,
  }
  let now = new Date();
  let nowTimeString = now.toString();
  Object.assign(favorite, {
    createTimestamp: now.getTime(),
    createLocalTime: nowTimeString
  })
  // debugLog('favorite', favorite)
  // 根据条件插入所有用户
  db.collection(TABLE).add({
    data: favorite,
    success: res => {
      let result = res;
      debugLog('【插入结果】user', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '插入记录失败'
      })
      debugLog('[数据库USER] [插入记录] 失败：', err)
    }
  })
}

const isFavorited = function(tableName, pWhere, callback){
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where =
    _.and({
      table: tableName,
      thing: {
        tags: gConst.IS_FAVORITED
      }
    }
      , {
        thing: pWhere
      }
    )
  // debugLog('where', where)
  db.collection(TABLE)
    .aggregate()
    .match(where)
    .group({
      _id: '$thing._id',
      thing: $.first('$thing')
    })
    .limit(1)
    .end()
    .then(
      res => {
        let result = res.list;
        // debugLog('getFavorites.result', result);
        let thing = null
        if (result.length) {
          thing = result[0].thing
          if (thing.tags.includes(gConst.IS_FAVORITED)) {
            thing['isFavorited'] = true
          }
        }

        callback(thing)
      })  
}

const removeFavorite = function (tableName, removeData, callback) {
  const db = wx.cloud.database()
  // let _id = removeData._id
  // 根据条件插入所有用户
  db.collection(TABLE).where({
    table: tableName,
    thing: {
      word: removeData.word
    }
  }).remove({
    success: res => {
      let result = res;
      debugLog('【删除结果】 favorites count:', result);
      callback(result)
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '删除记录失败'
      })
      debugLog('[数据库USER] [删除记录] 失败：', err)
    }
  })
}

function getTags(tableName, pWhere, pageIdx, callback){
  // debugLog('tableName', tableName)
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = {
    table: tableName,
  }
  Object.assign(where, {thing: pWhere})
  debugLog('where', where)

  db.collection(TABLE)
    .aggregate()
    .match(where)
    .unwind('$thing.tags')
    .group({
      _id: '$thing.tags',
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

function getFavorites(tableName, pWhere, pageIdx, callback) {
  // debugLog('pWhere', pWhere)
  let perPageCount = 20
  let where = 
  _.and({
      table: tableName,
      thing: {
        tags: gConst.IS_FAVORITED
      }
    }
    ,{
        thing: pWhere
    }
  )
  // debugLog('where', where)
  db.collection(TABLE)
    .aggregate()
    .match(where)
    .group({
      _id: '$thing._id',
      thing: $.first('$thing')
    })
    .skip(pageIdx * perPageCount)
    .end()
    .then(
      res => {
        let result = res.list;
        // debugLog('getFavorites.result', result);
        let things = []
        if (result.length) {
          for (let i in result) {
            things.push(result[i].thing)
          }     
          // debugLog('getFavorites.things', things)
          
        }
        callback(things, pageIdx)
  })
}

module.exports = {
  createFavorite: createFavorite,
  removeFavorite: removeFavorite,
  getFavorites: getFavorites,
  getTags: getTags,
  isFavorited: isFavorited,
}