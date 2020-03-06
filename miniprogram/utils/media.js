
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const debugLog = require('log.js').debug;
const errorLog = require('log.js').error;
const MSG = require('../const/message.js')
const utils = require('../utils/util.js')


/**
 * 拍照或者选择手机中的图片
 */
function takeOrChooseImage(that, callback, count = 1){
  if (!count){
    count = 1
  }
  let tempFiles;
  wx.chooseImage({
    count: count, // 默认9
    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
    success: res => {
      // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
      // debugLog('takeOrChooseImage.res', res)
      if (res.tempFiles && res.tempFiles.length > 0){
        tempFiles = res.tempFiles
      }
    },
    fail: err => {
      tempFilePath = null
    },
    complete: sth => {
      // debugLog('tempFiles', tempFiles)
      utils.runCallback(callback)(that, tempFiles)
    }
  })
}

/**
 * 上传媒体文件
 */
function upLoadImage(uploadFile, callback) {
  // 上传图片
  wx.cloud.uploadFile({
    cloudPath: uploadFile.cloudPath,
    filePath: uploadFile.path,
    success: res => {
      // debugLog('uploadFile', res)
      wx.cloud.getTempFileURL({
        fileList: [res.fileID]
      }).then(res => {
        let url = res.fileList[0].tempFileURL
        debugLog('uploaded url', url)
        utils.runCallback(callback)(url)
      }).catch(error => {
        // handle error
      })
    },
    fail: e => {
      errorLog('[上传文件] 失败:', e.stack)
      wx.showToast({
        title: MSG.UPLOAD_FAILED,
        duration: 500
      })
    },
    complete: () => {
    }
  })
}

/**
 * 生成媒体文件路径和名称
 */
function makeMediaFilePath(params){
  let path = ''
  let i
  for(i = 0; i < params.length - 1; i++){
    path += (i == 0) ? params[i]: ("/" + params[i])
  }
  let filename = new Date().getTime().toString() + '.' + params[i]
  path += "/" + filename
  return path
}

/**
 * 批量生成CloudPath
 */
function makeFilesCloudPath(filesPath, pParams){
  debugLog('pParams', pParams)
  let params = [].concat(pParams)
  for (let i in filesPath) {
    filesPath[i]['cloudPath'] = 
      makeMediaFilePath(params.concat([utils.getFileExtension(filesPath[i].path)]))
  }
}

/**
 * 当所有内容都上传完
 */
function whenAllUploaded(filesPath, callback){
  // debugLog('typeof filesPath', typeof filesPath)
  // debugLog('filesPath', filesPath)
  if(!filesPath 
    || filesPath.length < 1){
    return 
  }
  let intervalSec = 1000
  let i = 0
  let uploadedCount = 0
  let accuSec = 0
  let limitTime = (filesPath.length + 10) * intervalSec
  let timer = setInterval(()=>{
    let filePath
    if(i < filesPath.length){
      filePath = filesPath[i]
      debugLog('filePath', filePath)
    }
    i++
    accuSec = intervalSec * i
    // debugLog('accuSec', accuSec)
    // debugLog('limitTime', limitTime)
    // debugLog('i', i)
    // 中止时钟
    if (accuSec > limitTime || uploadedCount == filesPath.length){
      // debugLog('all uploaded', filesPath)
      utils.runCallback(callback)(filesPath)
      clearInterval(timer)
    }
    try{
      if(filePath){
        upLoadImage(filePath, url => {
          debugLog('uploaded', url)
          filePath['url'] = url
          debugLog('uploaded filePath', filePath)
          uploadedCount++
          // delete filePath.path
        })
      }
    }catch(err){
      errorLog('whenAllUploaded.err', err.stack)
    }

  }, intervalSec)
}

module.exports = {
  upLoadImage: upLoadImage,
  takeOrChooseImage: takeOrChooseImage,
  makeMediaFilePath: makeMediaFilePath,
  whenAllUploaded: whenAllUploaded,
  makeFilesCloudPath: makeFilesCloudPath
}