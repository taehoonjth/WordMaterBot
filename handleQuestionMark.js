module.exports = function (recipientId) {
  sendSimpleTextMessage(recipientId, "너가");
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "'공부'라고 하면 단어 공부를 시작해");
  }, 1000);
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "'힌트'라고 하면 마지막 문제에 대한 힌트를 줘");
  }, 2000);
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "'복습'이라고 하면 지금까지 틀린 단어들 복습을 시작해");
  }, 3000);
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "'진도'라고 하면 현재 상황을 보여줘");
  }, 4000);
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "'추가기능'이라고 하면 또 다른 기능들을 알려줄께");
  }, 5000);
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "아참, 난 초성으로만 써도 알아들어^^");
  }, 6000);
}