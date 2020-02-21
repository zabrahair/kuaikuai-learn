module.exports = {
  CONFIGS: 'configs',
  MATH_DIVIDE: 'math-divide',
  ENGLISH_WORDS: 'english-words',
  CHINESE_WORDS: 'chinese-words',
  CHINESE_KNOWLEDGE: 'chinese-knowledge',
  USERS: 'users',
  SCORE_STANDARD: 'score-standard',
  LEARN_HISTORY: 'learn-history',
  FAVORITES: 'favorites',
  LIST: [
    {
      name: '中文词语',
      value: 'chinese-words',
    },
    {
      name: '英文单词',
      value: 'english-words',
    },
    {
      name: '中文知识',
      value: 'chinese-knowledge',
    },   
    {
      name: '两位四则运算',
      value: 'math-divide',
    },  
  ],
  MAP: {
    'english-words': {
      name: '英文单词',
      value: 'english-words', 
      lang: 'en_US',  
    },
    'chinese-words': {
      name: '中文词语',
      value: 'chinese-words',
      lang: 'zh_CN',
    },
    'chinese-knowledge': {
      name: '中文知识',
      value: 'chinese-knowledge',
      lang: 'zh_CN', 
    },
    'math-divide': {
      name: '两位四则运算',
      value: 'math-divide',
      lang: 'zh_CN',
    },    
  }
}