// System Const Variables
const MSG = require('../const/message.js')
const debugLog = require('../utils/log.js').debug;
const errorLog = require('../utils/log.js').error;
const gConst = require('../const/global.js');
const storeKeys = require('../const/global.js').storageKeys;
const utils = require('../utils/util.js');


function IntervalClock(interval) {
  this.interval = interval
  this.tasks = {}
  let that = this

  this.timer = null

  this.runningTime = 0

  this.start = function(){
    that.timer = setInterval(() => {
      that.runningTime += that.interval
      for (let i in that.tasks) {
        if (that.tasks[i].isEnable){
          // debugLog('task name', i)
          that.tasks[i].runnedTimes += 1 
          utils.runCallback(that.tasks[i].func)(that.tasks[i])
        }
      }
    }, that.interval)
  }

  this.stop = function () {
    clearInterval(that.timer)
    that.timer = null
    that.runningTime = 0
  }

  this.clearTasks = function () {
    that.tasks = {}
  }

  this.getTasks =  function(){
    return that.tasks
  }

  this.getTasksNameList = function () {
    let tasksNameList = Object.keys(that.tasks)
    return tasksNameList
  }

  this.addTask = function(newTaskName, newTask, isEnableNow = true) {
    Object.assign(that.tasks, 
    {
        [newTaskName]: {
          name: newTaskName,
          isEnable: isEnableNow,
          runnedTimes: 0,
          func: newTask,
        }
    })
  }

  this.stopTask = function(taskName){
    that.tasks[taskName].isEnable = false
  }

  this.startTask = function (taskName) {
    that.tasks[taskName].isEnable = true
  }
}

function Sample(){
  let timer = new IntervalClock(3000)
  timer.addTask('print', (task) => {
    // debugLog('I am invoker', new Date().toTimeString())
    if (task.runnedTimes > 3) {
      timer.stop()
    }
  }, false)
  timer.start()
  setTimeout(() => {
    timer.startTask('print')
  }, 2000)
}


module.exports = {
  IntervalClock: IntervalClock,
  Sample: Sample
}

