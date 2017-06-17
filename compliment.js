module.exports = function () {
  var sentences = ["잘했어요. 짝짝짝! 다음 단어!", "굿!", "굿 잡!", "좋아요.", "잘했어요.", "참 잘했어요", "훌륭해요", "대단해요", "놀랍네요", "혹시 천재?", "님 최고!", "잘한다 잘한다 잘한다!", "짱짱맨!", "아이큐가 150?", "그레이트!", "퍼팩트!", "킹왕짱!", "굳뜨!"];
  var randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
}