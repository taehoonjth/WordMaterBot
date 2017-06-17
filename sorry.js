module.exports = function () {
  var sentences = ['틀렸어요 ㅜㅜ', '틀렸네ㅜㅜ', '아닌데...', '틀릴 수도 있지. 안그래?', '틀렸다. 기억하자!', '앗 틀렸다!'];
  var randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
}