//message event

console.log(JSON.parse('{"object":"page","entry":[{"id":"1510277132370161","time":1496746823640,"messaging":[{"sender":{"id":"959653127470689"},"recipient":{"id":"1510277132370161"},"timestamp":1496746823517,"message":{"mid":"mid.$cAAVdluBYkNVirlVXXVcfRAOxVm_v","seq":7399,"text":"\\ud638\\uc774"}}]}]}').entry[0].messaging);
console.dir(JSON.parse('{"object":"page","entry":[{"id":"1510277132370161","time":1496748514222,"messaging":[{"recipient":{"id":"1510277132370161"},"timestamp":1496748514222,"sender":{"id":"959653127470689"},"postback":{"payload":"USER_DEFINED_PAYLOAD"}}]}]}').entry[0].messaging);

event.entry[0].messaging
[ { sender: { id: '959653127470689' },
    recipient: { id: '1510277132370161' },
    timestamp: 1496746823517,
    message: 
     { mid: 'mid.$cAAVdluBYkNVirlVXXVcfRAOxVm_v',
       seq: 7399,
       text: '호이' } } ]

event.entry[0].messaging
[ { recipient: { id: '1510277132370161' },
    timestamp: 1496748514222,
    sender: { id: '959653127470689' },
    postback: { payload: 'USER_DEFINED_PAYLOAD' } } ]


message:{
  "attachment":{
    "type":"template",
    "payload":{
      "template_type":"button",
      "text":'deprivation',
      "buttons":[
        {
          "type":"postback",
          "title":'박탈, 상실',
          "payload":"USER_DEFINED_PAYLOAD"
        },
        {
          "type":"postback",
          "title":'지속 기간, 지속',
          "payload":"USER_DEFINED_PAYLOAD"
        },
        {
          "type":"postback",
          "title":'유발하다',
          "payload":"USER_DEFINED_PAYLOAD"
        }
      ]
    }
  }
}