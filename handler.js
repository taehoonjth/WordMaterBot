'use strict';

const words = require('./words.json')

//import function
const questionMaker = require('./questionMaker')
const compliment = require('./compliment')
const sorry = require('./sorry')

const wordsDetail = require('./wordsDetail.json');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

const VERIFY_TOKEN = "my_awesome_token";
const https = require('https');
const PAGE_ACCESS_TOKEN = "EAAboQgaMNgcBAJRu6ZCyCPBY3tX5Fql2dqVEwQ8ZBHr5srwZBOBqcW84ZBzPKnRoTBaHZC2dW900czjLqvI8iAQm3xJYyZCrCFdKXnnL7NcTJaO5zJZCZAWSmwmyP4ZBXoFEOoWCM4WRf3RsIeBsvn49mjoMvZCrlqpoYj1CMyd1SnHQZDZD";

exports.intents = (event, context, callback) => {
  var functionStart = Date.now();
  console.log("Webhook received event");  
  console.log("event.body: ", event.body);
  // process GET request
  if(event.queryStringParameters){
    var queryParams = event.queryStringParameters;
    var rVerifyToken = queryParams['hub.verify_token']
    if (rVerifyToken === VERIFY_TOKEN) {
      var challenge = queryParams['hub.challenge']
      var response = {
        'body': parseInt(challenge),
        'statusCode': 200
      };
      callback(null, response);
    }else{
      var response = {
        'body': 'Error, wrong validation token',
        'statusCode': 422
      };
      callback(null, response);
    }
  
  // process POST request
  } else {
    var data = JSON.parse(event.body);
    // Make sure this is a page subscription
    if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      // Iterate over each messaging event
      entry.messaging.forEach(function(msg) {
        //데이터베이스에서 userData 읽기
        var params = {
          TableName: 'wordBot',
          Key: {
            UserId: Number(msg.sender.id)
          }
        }
        docClient.get(params).promise()
        .then((data) => {
          // console.log('첫번째 프로미스 data', data);
          if (data.Item && data.Item.userData) {
            return data;
          } else {
            var userData = {
              study: {
                currentWordIndex: 0
              },
              test: {
                currentWordIndex: 0
              }
            }
            var params = {
              TableName:'wordBot',
              Key:{
                "UserId": Number(msg.sender.id)
              },
              UpdateExpression: "set userData=:a",
              ExpressionAttributeValues:{
                  ":a":userData
              },
              ReturnValues:"UPDATED_NEW"
            };
            console.log("Updating the item...");
            return docClient.update(params).promise().then((data) => {
              var params = {
                TableName: 'wordBot',
                Key: {
                  UserId: Number(msg.sender.id)
                }
              }
              return docClient.get(params).promise().then((data) => {
                return data;
              })
            });
          }
        })//end of first promist
        .then((data) => {
          console.log(`두번째 프로미스 시작 까지 ${Date.now() - functionStart} 걸림`);
        //두번째 프로미스 시작
          //console.log('두번째 프로미스 체인 data: ', data);
          var studyIndex = data.Item.userData.study.currentWordIndex;
          var testIndex = data.Item.userData.test.currentWordIndex;

          if (msg.read) {
            // console.log(`
            //   유저가 ${msg.read.watermark} 메시지 읽음
            //   msg: ${JSON.stringify(msg)}`);
          } else if (msg.delivery) {
            // console.log(`
            //   ${msg.delivery.watermark} 딜리버리 됨
            //   msg: ${JSON.stringify(msg)}`);
          } else if (msg.message) {
            if (msg.message['is_echo'] === true) {
              // console.log(`
              //   ${msg.message.text}에 대한 에코
              //   msg: ${JSON.stringify(msg)}`);
            } else {
              // console.log(`
              //   유저가 메시지 보냄
              //   유저: ${msg.sender.id}
              //   메시지: ${msg.message.text}
              //   msg: ${JSON.stringify(msg)}`)
              //따봉 처리
              if (msg.message.sticker_id) {
                if (msg.message.sticker_id === 369239263222822) {
                  handleThumbsUp(msg.sender.id);
                } else if (msg.message.sticker_id === 369239343222814 || msg.message.sticker_id === 369239383222810) {
                  handleBigThumbsUp(msg.sender.id);
                } else {
                  sendSimpleTextMessage(msg.sender.id, "뭔말인지 모르겠다. 공부나 하자");
                  setTimeout(() => {
                    sendSimpleTextMessage(msg.sender.id, "나한테 '?'를 보내면");
                  }, 1000);
                  setTimeout(() => {
                    sendSimpleTextMessage(msg.sender.id, "내가 뭘 할 수 있는지 알려줄께");
                  }, 2000);
                }
                //도움말 처리
              } else if (msg.message.text === "?") {
                handleQuestionMark(msg.sender.id);
              } else if (msg.message.text.indexOf('복습') !== -1 || msg.message.text.indexOf('ㅂㅅ') !== -1) {
                // changeMode(msg.sender.id, 'review');
                // sendSimpleTextMessage(msg.sender.id, '자 틀렸던 단어 복습을 시작하자!');
                // sendQuestionMessage(msg.sender.id);
                changeMode(msg.sender.id, 'review');
                var params = {
                  TableName: 'wordBot',
                  Key: {
                    UserId: Number(msg.sender.id)
                  }
                }
                docClient.get(params).promise()
                .then((data) => {
                  var timeNow = Date.now();
                  var reviewCollection = data.Item.review.filter((element) => {
                    return element.date < timeNow;
                  });
                  if (reviewCollection.length === 0) {
                    sendSimpleTextMessage(msg.sender.id, `지금 복습할게 전혀 없네^^`);
                  } else {
                    sendSimpleTextMessage(msg.sender.id, `지금 복습할게 ${reviewCollection.length}개 있네`);
                    // setTimeout(() => {
                    //   quickReply(msg.sender.id, '지금 복습 할래?', '그래', '나중에');
                    // }, 1000);
                    setTimeout(() => {
                      sendSimpleTextMessage(msg.sender.id, `복습 시작한다.`);
                    }, 1000);
                    setTimeout(() => {
                      sendQuestionMessage(msg.sender.id, reviewCollection[0].word, 'review');
                    }, 2000);
                  }
                });
              } else if (msg.message.text.indexOf('공부') !== -1 || msg.message.text.indexOf('ㄱㅂ') !== -1) {
                changeMode(msg.sender.id, 'test');
                sendSimpleTextMessage(msg.sender.id, '자 공부를 시작하자!');
                setTimeout(() => {
                  sendQuestionMessage(msg.sender.id, words[testIndex], 'test');
                }, 1000);
              } else if (msg.message.text.indexOf('진도') !== -1 || msg.message.text.indexOf('ㅈㄷ') !== -1) {
                var params = {
                  TableName: 'wordBot',
                  Key: {
                    UserId: Number(msg.sender.id)
                  }
                }
                docClient.get(params, function(err, data) { 
                  if (err) {
                    console.log(err);
                  } else {
                    console.log(data);
                    var history = data.Item.history;
                    var arrangedData = {
                      wrongWords: {},
                      rightCnt: 0,
                      wrongCnt: 0
                    };
                    history.forEach((element) => {
                      if (element.right) {
                        arrangedData.rightCnt++;
                      } else {
                        arrangedData.wrongCnt++;
                        if (arrangedData.wrongWords[element.word]) {
                          arrangedData.wrongWords[element.word]++;
                        } else {
                          arrangedData.wrongWords[element.word] = 1;
                        }
                      }
                    });
                    var wrongWordsSentence = '';
                    for (var key in arrangedData.wrongWords) {
                      wrongWordsSentence += key + ', ';
                    }
                    var reviewCollection = data.Item.review.filter((element) => {
                      return element.date < timeNow;
                    });
                    sendSimpleTextMessage(msg.sender.id, `총 1233 단어 중 ${data.Item.userData.test.currentWordIndex}번째 단어 학습 중이고`);
                    setTimeout(() => {
                      sendSimpleTextMessage(msg.sender.id, `지금 복습할게 ${reviewCollection.length}개 있네`);
                    }, 2000);
                    setTimeout(() => {
                      sendSimpleTextMessage(msg.sender.id, `수고했어`);
                    }, 4000);
                    setTimeout(() => {
                      sendSimpleTextMessage(msg.sender.id, `틀렸던 단어들 한번 보여줄께`);
                    }, 6000);
                    setTimeout(() => {
                      sendSimpleTextMessage(msg.sender.id, wrongWordsSentence);
                    }, 8000);
                    setTimeout(() => {
                      sendSimpleTextMessage(msg.sender.id, '복습 한번 하고가~');
                    }, 10000);
                  }
                })
              } else if (msg.message.text.indexOf('힌트') !== -1 || msg.message.text.indexOf('ㅎㅌ') !== -1) {
                quickReply(msg.sender.id, '원하는 힌트를 아래서 골라봐', '예문', '유의어', '어원');
              } else if (msg.message.text.indexOf('예문') !== -1 || msg.message.text.indexOf('ㅇㅁ') !== -1) {
                getLastCheckedWord(msg.sender.id)
                .then((data) => {
                  console.log('data.Item.lastWord(from promise): ', data.Item.lastWord);
                  var recentQuestion = data.Item.lastWord;
                  var examples = getExamples(recentQuestion);
                  if (examples.length === 0) {
                    sendSimpleTextMessage(msg.sender.id, '앗 예문이 하나도 없네ㅋㅋ. 미안.');
                    setTimeout(() => {
                      quickReply(msg.sender.id, '다른거 골라봐', '예문', '유의어', '어원');
                    }, 1500);
                  } else {
                    examples.forEach(function(example) {
                      sendSimpleTextMessage(msg.sender.id, example);
                    });
                  }
                });
              } else if (msg.message.text.indexOf('유의어') !== -1 || msg.message.text.indexOf('ㅇㅇㅇ') !== -1) {
                getLastCheckedWord(msg.sender.id)
                .then((data) => {
                  console.log('data.Item.lastWord(from promise): ', data.Item.lastWord);
                  var recentQuestion = data.Item.lastWord;
                  var synonyms = getSynonyms(recentQuestion);
                  if (synonyms.length === 0) {
                    sendSimpleTextMessage(msg.sender.id, '앗 유의어가 하나도 없네ㅋㅋ. 미안.');
                    setTimeout(() => {
                      quickReply(msg.sender.id, '다른거 골라봐');
                    }, 1500);
                  } else {
                    synonyms.forEach(function(example) {
                      sendSimpleTextMessage(msg.sender.id, example);
                    });
                  }
                });
              } else if (msg.message.text.indexOf('어원') !== -1 || msg.message.text.indexOf('ㅇㅇ') !== -1) {
                getLastCheckedWord(msg.sender.id)
                .then((data) => {
                  console.log('data.Item.lastWord(from promise): ', data.Item.lastWord);
                  var recentQuestion = data.Item.lastWord;
                  var derivation = getDerivation(recentQuestion);
                  if (derivation.length === 0) {
                    sendSimpleTextMessage(msg.sender.id, '앗 어원이 하나도 없네ㅋㅋ. 미안.');
                    setTimeout(() => {
                      quickReply(msg.sender.id, '다른거 골라봐');
                    }, 1500);
                  } else {
                    derivation.forEach(function(example) {
                      sendSimpleTextMessage(msg.sender.id, example);
                    });
                  }
                });
              } else if (msg.message.text.indexOf('관계') !== -1 || msg.message.text.indexOf('ㄱㄱ') !== -1) {
                getLastCheckedWord(msg.sender.id)
                .then((data) => {
                  console.log('data.Item.lastWord(from promise): ', data.Item.lastWord);
                  var recentQuestion = data.Item.lastWord;
                  var hierarchy = getHierarchy(recentQuestion);
                  var messageTime = 500;
                  var listTime = 1500;
                  for (var key in hierarchy) {
                    console.log('hierarchy loop', key);
                    var text;
                    if (hierarchy[key].length === 0) {
                      continue;
                    } else {
                      if (key === 'partOf') {
                        text = '는 아래 단어들의 부분이야';
                      } else if (key === 'typeOf') {
                        text = '는 아래 단어들의 한 타입이야';
                      } else if (key === 'hasTypes') {
                        text = '는 아래와 같은 타입들을 가지고 있어';
                      } else if (key === 'substanceOf') {
                        text = '는 아래 단어의 구성 성분이야';
                      }
                      setTimeout(() => {
                        sendSimpleTextMessage(msg.sender.id, recentQuestion + text);
                      }, messageTime);
                      setTimeout(() => {
                        sendSimpleTextMessage(msg.sender.id, hierarchy[key].join(', '));
                      }, listTime);
                      messageTime += 1000;
                      listTime += 1000;
                    }
                  }
                });
              } else if (msg.message.quick_reply) {
                var whatUserWant = msg.message.quick_reply.payload;
                getLastCheckedWord(msg.sender.id);
              } else {
                sendSimpleTextMessage(msg.sender.id, "뭔말인지 모르겠다. 공부나 하자");
                setTimeout(() => {
                  sendSimpleTextMessage(msg.sender.id, "나한테 '?'를 보내면");
                }, 1000);
                setTimeout(() => {
                  sendSimpleTextMessage(msg.sender.id, "내가 뭘 할 수 있는지 알려줄께");
                }, 2000);
              }
            }
          } else if (msg.postback) {
            // console.log(`
            //   유저가 답을 선택함
            //   유저: ${msg.sender.id}
            //   메시지: ${msg.postback.payload}
            //   msg: ${msg}`)
            receivedPayload(msg, data.Item);
          } else {
            console.log(`Webhook received unknown event
              event.body: ${event.body}`);
          }
        //두번째 프로미스 끝
        })
        .catch((err) => {
          console.log("Promise Rejected");
          console.log(err);
        })
      });
    });
    
    }
    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    var response = {
      'body': "ok",
      'statusCode': 200
    };
      
    callback(null, response);
  }
}

function getExamples(word) {
  var recentQuestion = word
  var examples = [];
  wordsDetail[recentQuestion].forEach(function(element) {
    if (element.examples) {
      element.examples.forEach(function(sentence) {
        examples.push(sentence);
      })
    }
  });
  return examples;
};

function getHierarchy(word) {
  var result = {
    partOf: [],
    typeOf: [],
    hasTypes: []
  }
  wordsDetail[word].forEach(function(element) {
    if (element.partOf) {
      element.partOf.forEach(function(word) {
        result.partOf.push(word);
      })
    }
  });
  wordsDetail[word].forEach(function(element) {
    if (element.typeOf) {
      element.typeOf.forEach(function(word) {
        result.typeOf.push(word);
      })
    }
  });
  wordsDetail[word].forEach(function(element) {
    if (element.hasTypes) {
      element.hasTypes.forEach(function(word) {
        result.hasTypes.push(word);
      })
    }
  });
  return result;
}

function getDerivation(word) {
  var result = [];
  wordsDetail[word].forEach(function(element) {
    if (element.derivation) {
      element.derivation.forEach(function(derivation) {
        result.push(derivation);
      })
    }
  });  
  return result;
}

function getSynonyms(word) {
  var result = [];
  wordsDetail[word].forEach(function(element) {
    if (element.synonyms) {
      element.synonyms.forEach(function(synonym) {
        result.push(synonym);
      })
    }
  });  
  return result;
}

function getLastCheckedWord(senderId) {
  var params = {
    TableName: 'wordBot',
    Key: {
      UserId: Number(senderId)
    }
  }
  return docClient.get(params).promise();
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  // console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  // console.log(JSON.stringify(message));
  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        //sendGenericMessage(senderID);
        break;
      default:
        sendQuestionMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendQuestionMessage(senderID, "Message with attachment received");
  }
}

function receivedPayload(event, Item) {
  console.log(`receivedPayload
    ${JSON.stringify(event)}`);
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var payload = JSON.parse(event.postback.payload);
  var questionWord = payload.word;
  var korean = payload.korean;
  var userAnswer = payload.userAnswer;
  var rightOrWrong = payload.rightOrWrong;
  var questionDate = payload.generatedTime;
  var questionMode = payload.mode;
  var reviewDate = payload.reviewDate;
  var now = Date.now();
  console.log('typeof event.postback.payload', typeof event.postback.payload);

  if (questionMode === 'test') {
    if (Item.studyMode === 'test') {
      var params = {
          TableName:'wordBot',
          Key:{
            "UserId": Number(senderID)
          },
          UpdateExpression: "set userData.test.currentWordIndex = userData.test.currentWordIndex + :val",
          ExpressionAttributeValues:{
              ":val":1
          },
          ReturnValues:"UPDATED_NEW"
      };
    } else if (Item.studyMode === 'study') {
      var params = {
          TableName:'wordBot',
          Key:{
            "UserId": Number(senderID)
          },
          UpdateExpression: "set userData.study.currentWordIndex = userData.study.currentWordIndex + :val",
          ExpressionAttributeValues:{
              ":val":1
          },
          ReturnValues:"UPDATED_NEW"
      };
    }
    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
      if (err) {
        console.log("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("userData.study.currentWordIndex = userData.study.currentWordIndex + :val succeeded");
        // console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
      }
    });
    console.log(typeof Item.userData.test.currentWordIndex, Item.userData.test.currentWordIndex );
    var index = Item.userData.test.currentWordIndex + 1;
    console.log('질문을 위한 index: ', index);

    //만약 답이 맞으면 맞았다고 말하고 0.5초 후 다음 문제
    if (rightOrWrong) {
      console.log('여유시간: ', (questionDate  + 1000 * 8) - now);
      if (questionDate  + 1000 * 8 < now) {
        sendSimpleTextMessage(senderID, compliment());
        setTimeout(() => {
          sendSimpleTextMessage(senderID, '근데 좀 늦게 답했으니까 나중에 리뷰 한번 하자');
        }, 1500)
        updateHistory(senderID, questionWord, true);
        var reviewTime = Date.now() + 1000 * 60 * 1; //1분
        putReview(senderID, questionWord, false, reviewTime);
        setTimeout(() => {
          sendQuestionMessage(senderID, words[index], questionMode);
        }, 3000);
      } else {
        sendSimpleTextMessage(senderID, compliment());
        updateHistory(senderID, questionWord, true);
        setTimeout(() => {
          sendQuestionMessage(senderID, words[index], questionMode);
        }, 1000);
      }
    } else { //틀렸으면 틀렸다고 말해주고 잠시 생각해보라 하고 3초 후 답 주고 1초 후 다음 문제
      sendSimpleTextMessage(senderID, sorry());
      updateHistory(senderID, questionWord, false);
      var reviewTime = Date.now() + 1000 * 60 * 1; //1분
      putReview(senderID, questionWord, false, reviewTime);
      setTimeout(() => {
        sendSimpleTextMessage(senderID, `${questionWord} : ${korean}`);
      }, 1000);
      setTimeout(() => {
        sendQuestionMessage(senderID, words[index], questionMode);
      }, 3000);
    }
  } else if (questionMode === 'review') {
    //해당 엘리먼트를 리뷰에서 지우고
    var params = {
        TableName:'wordBot',
        Key:{
          "UserId": Number(senderID)
        },
        UpdateExpression: "REMOVE review[0]",
        ReturnValues:"UPDATED_NEW"
    };
    docClient.update(params).promise()
    .then((data) => {
      var params = {
        TableName: 'wordBot',
        Key: {
          UserId: Number(senderID)
        }
      }
      docClient.get(params).promise()
      .then((data) => {
        var timeNow = Date.now();
        var reviewCollection = data.Item.review.filter((element) => {
          return element.date < timeNow;
        });
        //맞았으면 
        if (rightOrWrong) {
          if (questionDate  + 1000 * 10 < now) {
            var reviewTime = Date.now() + 1000 * 60 * 60 * 24; //1일
            putReview(senderID, questionWord, true, reviewTime);
            sendSimpleTextMessage(senderID, compliment());
            setTimeout(() => {
              sendSimpleTextMessage(senderID, '근데 좀 늦게 답했으니까 나중에 또 리뷰 하자');
            }, 1500)
            if (reviewCollection.length === 0) {
              setTimeout(() => {
                sendSimpleTextMessage(senderID, `복습 끝! 축하축하!`);
              }, 3000);
            } else {
              setTimeout(() => {
                sendSimpleTextMessage(senderID, `다음꺼 간다`);
              }, 2500);
              console.log('리뷰 페이로드에서: data.Item', data.Item);
              setTimeout(() => {
                sendQuestionMessage(senderID, reviewCollection[0].word, 'review');
              }, 3000);
            }
          } else {
            var reviewTime = Date.now() + 1000 * 60 * 60 * 24 * 5; //5일
            putReview(senderID, questionWord, true, reviewTime);
            sendSimpleTextMessage(senderID, compliment());
            if (reviewCollection.length === 0) {
              setTimeout(() => {
                sendSimpleTextMessage(senderID, `복습 끝! 축하축하!`);
              }, 1000);
            } else {
              setTimeout(() => {
                sendSimpleTextMessage(senderID, `다음꺼 간다`);
              }, 1000);
              console.log('리뷰 페이로드에서: data.Item', data.Item);
              setTimeout(() => {
                sendQuestionMessage(senderID, reviewCollection[0].word, 'review');
              }, 2000);
            }
          }
        //틀렸으면
        } else {
          sendSimpleTextMessage(senderID, '또 틀렸네. 괜찮아.');
          setTimeout(() => {
            sendSimpleTextMessage(senderID, `계속 반복 하면 돼`);
          }, 500);
          // updateHistory(senderID, questionWord, false);
          var reviewTime = Date.now() + 1000 * 60 * 1; //1분
          setTimeout(() => {
            sendSimpleTextMessage(senderID, `${questionWord} : ${korean}`);
          }, 1000);
          if (reviewCollection.length === 0) {
            setTimeout(() => {
              sendSimpleTextMessage(senderID, `복습 끝! 축하축하!`);
            }, 3000);
          } else {
            setTimeout(() => {
              sendQuestionMessage(senderID, reviewCollection[0].word, 'review');
            }, 3000);
          }
          putReview(senderID, questionWord, false, reviewTime);
        }
      });
    })

  } else {
    console.log('테스트도 아니고 리뷰도 아닌 이상한 페이로드가 들어왔네?');
    console.log(`event: ${JSON.stringify(event)}`);
  }
}

function updateHistory(senderID, questionWord, rightOrWrong) {
  var reviewTime;

  var params = {
      TableName:'wordBot',
      Key:{
        "UserId": Number(senderID)
      },
      UpdateExpression: 'set #history = list_append(if_not_exists(#history, :empty_list), :data)',
      ExpressionAttributeNames: {
        '#history': 'history'
      },
      ExpressionAttributeValues: {
        ':data': [{
            word: questionWord,
            right: rightOrWrong,
            date: Date.now()
          }],
        ':empty_list': []
      },
      ReturnValues:"UPDATED_NEW"
  };


  console.log("Updating the item...");
  docClient.update(params, function(err, data) {
    if (err) {
      console.log("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("UpdateItem succeeded");
      // console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
}

function putReview(senderID, questionWord, rightOrWrong, reviewTime) {
  var params = {
      TableName:'wordBot',
      Key:{
        "UserId": Number(senderID)
      },
      UpdateExpression: 'set #review = list_append(if_not_exists(#review, :empty_list), :data)',
      ExpressionAttributeNames: {
        '#review': 'review'
      },
      ExpressionAttributeValues: {
        ':data': [{
            word: questionWord,
            right: rightOrWrong,
            date: reviewTime
          }],
        ':empty_list': []
      },
      ReturnValues:"UPDATED_NEW"
  };

  console.log("Updating the item...");
  docClient.update(params, function(err, data) {
    if (err) {
      console.log("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("UpdateItem succeeded");
      // console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
}

function changeMode(recipientId, mode) {
  var params = {
      TableName:'wordBot',
      Key:{
        "UserId": Number(recipientId)
      },
      UpdateExpression: "set studyMode=:a",
      ExpressionAttributeValues:{
          ":a":mode
      },
      ReturnValues:"UPDATED_NEW"
  };

  console.log("Updating the item...(changeMode)");
  docClient.update(params, function(err, data) {
    if (err) {
      console.log("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("UpdateItem succeeded");
      // console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
}

function handleQuestionMark(recipientId) {
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

function sendSimpleTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}

function quickReply(recipientId, messageText) {
  var quick_replies = [];
  for (var i = 2; i < arguments.length; i++) {
    var quick_reply = {
      "content_type":"text",
      "title":arguments[i],
      "payload":arguments[i]
    };
    quick_replies.push(quick_reply);
  }
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text": messageText,
      "quick_replies": quick_replies
    }
  };
  callSendAPI(messageData);
}

function sendQuestionMessage(recipientId, word, mode) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: questionMaker(word, mode)
  };
  console.log('messageData.message.attachment.payload: ', messageData.message.attachment.payload);

  var params = {
      TableName:'wordBot',
      Key:{
        "UserId": Number(recipientId)
      },
      UpdateExpression: "set lastWord=:a",
      ExpressionAttributeValues:{
          ":a":word
      },
      ReturnValues:"UPDATED_NEW"
  };

  console.log("Updating the item...");
  docClient.update(params, function(err, data) {
    if (err) {
      console.log("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("UpdateItem succeeded");
      // console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
  sendSimpleTextMessage(recipientId, word + " 뜻은?");
  setTimeout(() => {
    callSendAPI(messageData);
  }, 2000);
}

function callSendAPI(messageData) {
  var body = JSON.stringify(messageData);
  var path = '/v2.6/me/messages?access_token=' + PAGE_ACCESS_TOKEN;
  var options = {
    host: "graph.facebook.com",
    path: path,
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  };
  var callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });
    response.on('end', function () {
 
    });
  }
  var req = https.request(options, callback);
  req.on('error', function(e) {
    console.log('problem with request: '+ e);
  });
 
  req.write(body);
  req.end();
}


function handleThumbsUp(recipientId) {
  sendSimpleTextMessage(recipientId, "따봉 고마워");
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "근데 큰 따봉 줄 순 없었니?");
  }, 1000);
}

function handleBigThumbsUp(recipientId) {
  sendSimpleTextMessage(recipientId, "큰 따봉 고마워");
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "근데 난 너가 공부하는게 더 좋아");
  }, 1000);
  setTimeout(() => {
    sendSimpleTextMessage(recipientId, "미안.");
  }, 2000);
} 


