// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'kuaikuai-fjpqg',
  timeout: 60000
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command


// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // console.log('event:', JSON.stringify(event, null, 4))
  let table = event.table;
  // console.log('table:', JSON.stringify(table, null, 4))
  let wordsString = event.words
  wordsString = wordsString.trim()
  wordsString = wordsString.replace(/[\n\s,]+/gi,'，')
  // console.log('wordsString:', JSON.stringify(wordsString, null, 4))
  let words = wordsString.split('，')
  // console.log('words:', JSON.stringify(words, null, 4))
  let tagsString = event.tags
  tagsString = tagsString.trim()
  // console.log('tagsString:', JSON.stringify(wordsString, null, 4))
  let tags = tagsString.split('，')
  // console.log('tags:', JSON.stringify(tags, null, 4))
  let otherSegs = event.otherSegs
  let upsertResults = []
  let lastWord
  try{
    for (let i in words) {
      if ( !words[i] || words[i].trim() == '' ){
        continue;
      }
      // 已经存在就更新 tags
      let upResult
      for (let j in tags) {
        let now = new Date()
        upResult = await db.collection(table).where({
          word: words[i]
        })
          .update({
            data: {
              tags: _.addToSet(tags[j]),
              updateTime: now.getTime(),
            },
          })
        upsertResults.push(upResult)
        lastWord = words[i]
      }

      // upsertResults.push(upResult)
      if (upResult.stats.updated < 1) {
        // 不存在就添加
        let insertObj = Object.assign({}, otherSegs)
        insertObj = Object.assign(insertObj, {
          word: words[i],
          tags: tags,
        })
        let insResult = await db.collection(table).add({
          // data 字段表示需新增的 JSON 数据
          data: insertObj
        })
        upsertResults.push(insResult)
        lastWord = words[i]
      }
      
    }
    return {
      upsertResults: upsertResults,
      lastWord: lastWord,
    }
  }catch(e){
    return {
      error: e.stack,
      lastWord: lastWord,
    }
  }


}