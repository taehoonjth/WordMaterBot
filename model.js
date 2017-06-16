        var params = {
          TableName: 'wordBot',
          Key: {
            UserId: Number(msg.sender.id)
          }
        }
        docClient.get(params).promise()
        .then((data) => {
          console.log('첫번째 프로미스 data', data);
          if (data.Item && data.Item.userData) {
            return data;
          } else {
            var userData = {
              study: {
                index: 0
              },
              test: {
                index: 0
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
        //두번째 프로미스 시작
          //console.log('두번째 프로미스 체인 data: ', data);
          var studyIndex = data.Item.userData.study.index;
          var testIndex = data.Item.userData.test.index;


        })
        .catch((err) => {
          console.log("Promise Rejected");
          console.log(err);
        })