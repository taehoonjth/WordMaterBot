const words = require('./words.json')
const dictionary = require('./toeic.json')

module.exports = function (word, mode, reviewDate) {
  var word = word || "applicant";
  var reviewDate = reviewDate || -1;
  var randomIndexTwo = Math.floor(Math.random() * words.length);
  var randomIndexThree = Math.floor(Math.random() * words.length);
  var timeNow = Date.now();
  var titleOne = makeMeaning(dictionary[word]);
  var titleTwo = makeMeaning(dictionary[words[randomIndexTwo]]);
  var titleThree = makeMeaning(dictionary[words[randomIndexThree]]);

  var buttons = [
    {
      "type": "postback",
      "title": titleOne,
      "payload": JSON.stringify({
        word: word,
        korean: titleOne,
        userAnswer: titleOne,
        rightOrWrong: true,
        generatedTime: timeNow,
        mode: mode,
        reviewDate: reviewDate
      })
    },
    {
      "type":"postback",
      "title":titleTwo,
      "payload": JSON.stringify({
        word: word,
        korean: titleOne,
        userAnswer: titleTwo,
        rightOrWrong: false,
        generatedTime: timeNow,
        mode: mode,
        reviewDate: reviewDate 
      })
    },
    {
      "type":"postback",
      "title":titleThree,
      "payload": JSON.stringify({
        word: word,
        korean: titleOne,
        userAnswer: titleThree,
        rightOrWrong: false,
        generatedTime: timeNow,
        mode: mode,
        reviewDate: reviewDate 
      })
    }
  ];
  var message = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":pick(),
        "buttons":shuffle(buttons)
      }
    }
  };
  return message;
}

function makeMeaning(array) {
  return array.map((element) => {
    return element.m;
  }).join(', ');
}

function shuffle(array) {
  var m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

function pick() {
  var sentences = ['골라!', '다음 중 뭘까?', '빨리 골라!', '찍지 말고 골라!', '모르겠으면 힌트 외쳐!', '답은?'];
  var randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
}