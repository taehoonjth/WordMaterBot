'use strict';

const dic = require('./dictionary')
const wordsDetail = require('./wordsDetail.json');
const AWS = require('aws-sdk');

var dataBase = {};

var VERIFY_TOKEN = "my_awesome_token";
var https = require('https');
var PAGE_ACCESS_TOKEN = "EAAboQgaMNgcBAJRu6ZCyCPBY3tX5Fql2dqVEwQ8ZBHr5srwZBOBqcW84ZBzPKnRoTBaHZC2dW900czjLqvI8iAQm3xJYyZCrCFdKXnnL7NcTJaO5zJZCZAWSmwmyP4ZBXoFEOoWCM4WRf3RsIeBsvn49mjoMvZCrlqpoYj1CMyd1SnHQZDZD";
exports.intents = (event, context, callback) => {
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
  }else{
    var data = JSON.parse(event.body);
    // Make sure this is a page subscription
    if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
        var pageID = entry.id;
        var timeOfEvent = entry.time;
        // Iterate over each messaging event
        entry.messaging.forEach(function(msg) {
          if (msg.read) {
            console.log(`
              유저가 ${msg.read.watermark} 메시지 읽음
              msg: ${JSON.stringify(msg)}`);
          } else if (msg.delivery) {
            console.log(`
              ${msg.delivery.watermark} 딜리버리 됨
              msg: ${JSON.stringify(msg)}`);
          } else if (msg.message) {
            if (msg.message['is_echo'] === true) {
              console.log(`
                ${msg.message.text}에 대한 에코
                msg: ${JSON.stringify(msg)}`);
            } else {
              console.log(`
                유저가 메시지 보냄
                유저: ${msg.sender.id}
                메시지: ${msg.message.text}
                msg: ${JSON.stringify(msg)}`)
              if (msg.message.text.indexOf('힌트') !== -1) {
                quickReply(msg.sender.id, '원하는 힌트를 아래서 골라봐');
              } else {
                receivedMessage(msg);
              }
            }
          } else if (msg.postback) {
            console.log(`
              유저가 답을 선택함
              유저: ${msg.sender.id}
              메시지: ${msg.postback.payload}
              msg: ${msg}`)
            receivedPayload(msg);
          } else {
            console.log(`Webhook received unknown event
              event.body: ${event.body}`);
          }
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

  if (dataBase[senderID]) {
    dataBase[senderID].push(messageText);
  } else {
    dataBase[senderID] = [messageText];
  }

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        //sendGenericMessage(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPayload(event) {
  console.log(`receivedPayload
    ${JSON.stringify(event)}`);
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var questionAndAnswer = event.postback.payload.split('|');
  var questionWord = questionAndAnswer[0];
  var answer = questionAndAnswer[1];

  //만약 답이 맞으면 맞았다고 말하고 0.5초 후 다음 문제
  if (dic[questionWord] === answer) {
    sendSimpleTextMessage(senderID, compliment());
    setTimeout(() => {
      sendTextMessage(senderID);
    }, 500);
  } else { //틀렸으면 틀렸다고 말해주고 잠시 생각해보라 하고 3초 후 답 주고 1초 후 다음 문제
    sendSimpleTextMessage(senderID, `틀렸어요 ㅜㅜ`);
    setTimeout(() => {
      sendSimpleTextMessage(senderID, `${questionWord} : ${dic[questionWord]}`);
    }, 1000);
    setTimeout(() => {
      sendTextMessage(senderID);
    }, 3000);
  }
}

function compliment() {
  var sentences = ["잘했어요. 짝짝짝! 다음 단어!", "굿!", "굿 잡!", "좋아요.", "잘했어요.", "참 잘했어요", "훌륭해요", "대단해요", "놀랍네요", "혹시 천재?", "님 최고!", "잘한다 잘한다 잘한다!", "짱짱맨!", "아이큐가 150?", "그레이트!", "퍼팩트!", "킹왕짱!", "굳뜨!"];
  var randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
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
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":messageText,
      "quick_replies":[
        {
          "content_type":"text",
          "title":"예문",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
        },
        {
          "content_type":"text",
          "title":"유의어",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
        },
        {
          "content_type":"text",
          "title":"어원",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
        },
        {
          "content_type":"text",
          "title":"다른 단어와의 관계",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
        }
      ]
    }
  };
  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: messageGenerator()
  };
  callSendAPI(messageData);
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
  // console.log('req is over. dataBase: ', dataBase);
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

function messageGenerator() {

  var words = ["applicant","apprehensive","aptitude","associate","bilingual","broad","candidate","certification","commensurate","confidence","consultant","degree","eligible","employment","entitle","get through","highly","increment","lag","managerial","match","meet","minimum","occupation","opening","otherwise","paycheck","payroll","pension","probationary","professional","proficiency","prospective","qualified","recruit","reference","regardless of","requirement","resume","wage","abolish","access","accordance","according to","accuse","adhere","approval","at all time","attire","attorney","authorize","circumscribe","code","comply","concern","custody","effect","enforce","exception","form","fraud","habit","immediately","infringement","legislation","legitimate","litigation","observance","petition","policy","procedure","prohibit","prosecute","refrain","regulation","restrict","severely","standard","thoroughly","violate","accustomed","acquaint","affiliate","attendance","check","colleague","concentrate","condense","conglomerate","convey","corporation","delegate","demanding","directly","division","efficiently","electronically","extension","follow up on","impending","in one's absence","in writing","instruct","involved","manage","memorandum","notify","on one's own","oversee","proprietor","quarterly","release","remind","request","revision","submit","subordinate","subsidiary","supervision","translation","accomplish","adjust","agree","aspiration","assign","assist","assume","combined","conduct","confidential","contrary","coordinate","count on","creditable","direct","disturbing","draw on","duplicate","eminent","endeavor","engage","execute","foster","friction","get along with","hardly","insubordinate","intention","lax","malign","neutrality","occasionally","personnel","procrastinate","respectful","respective","responsible","routinely","subsequent","transform","undertake","voluntarily","widely","accessible","accidentally","advisable","aggravate","announcement","apparently","aspect","aware","compliance","concerned","contingency","demonstrate","divide","embrace","evacuate","expertise","extended","face","failure","feedback","follow","implement","inform","instead of","interruption","make sure","matter","outstanding","privilege","promptly","realistically","remainder","rush","sign out","sophisticated","speak","take on","timely","trigger","violation","abate","adversity","ailing","assert","boost","brisk","collapse","commerce","consequence","depression","deteriorate","dramatically","dwindle","economical","entail","fairly","fall","flourish","impede","implication","indicator","industrial","lead","likely","overall","promising","prospect","prosperity","rapidly","ratio","remain","skyrocket","slowdown","soar","stagnant","supplement","thrive","unstable","volatile","wane","admission","advocate","alumni","anonymous","appear","beneficial","care of","celebrity","censorship","collection","come in +서수","contestant","contributor","current","defy","donation","edition","enlightening","enthusiastically","exhibition","fascinating","have yet to do","improvise","informative","issue","lend","live","local","matinee","memoirs","municipal","must-see","note","out of print","periodical","popular","present","publication","showing","subscription","transferable","upcoming","variety","affect","analysis","claim","closely","comparison","competition","consecutive","consistently","consolidate","contend","demand","do one's utmost","effective","especially","examine","expand","expectation","extremely","focus","gap","gauge","impact","intervention","jeopardize","modestly","momentum","monopoly","mounting","perception","persistent","probable","raise","randomly","reflective","respondent","seasonal","segment","survey","tool","adopt","advantage","advertisement","advise","aggressively","aim","attract","await","cater","confront","consumer","creative","customer","deliberate","diversify","effort","endorse","experiment","favorably","feasible","fortify","forward","incentive","indicate","influence","instantly","introduce","largely","less","majority","marginal","mastermind","means","necessarily","need","repeatedly","strategy","affordable","alter","apparel","apply","area","auction","authentic","benefit","carefully","charge","delivery","description","dilute","equivalent","exactly","exclusively","exquisite","fit","installment","lately","merchandise","method","notice","offer","officially","price","purchase","readily","receipt","redeemable","refund","relatively","scent","sturdy","tax","thrifty","valid","value","voucher","warranty","assemble","attribute","automate","capable","capacity","carelessly","chemical","coming","comparable","damaged","device","discontinue","efficiency","equipment","evidently","fabricate","facility","fill","finished","halt","launch","material","operate","operational","place","power","precaution","prevent","processing","procurement","produce","properly","protective","quota","safety","separately","specification","stage","tolerance","utilize","absolute","accurate","advance","allow","appearance","bewildering","broaden","compatible","complement","concurrently","control","corrosion","development","devise","disruption","durable","envision","feature","following","grant","hold","improve","increasingly","indication","innovative","inspect","inspiration","interpretation","manufacturer","obsolete","patent","patronize","quality","reliable","research","revolutionary","sleek","state-of-the-art","streamline","sufficiently","superior","technical","vulnerable","apologize","appropriately","argumentative","blemish","cause","commitment","complaint","complete","compliment","confident","courteous","critical","deal","defective","disclose","escort","evaluation","fix","for free","further","genuine","guarantee","hesitate","inconvenience","infuriate","inquire","insert","mistakenly","notification","politely","rebate","replace","respond","return","satisfaction","seriously","specific","unwavering","accumulate","allowance","approximately","attraction","away","baggage","beforehand","board","brochure","customs","declare","depart","destination","diverse","dramatic","duty","embassy","emergency","exotic","fill out/in","hospitality","indulge","international","itinerary","jet lag","laundry","locate","missing","overhead","precisely","prior to","proximity","remittance","round trip","seating","superb","swap","touch down","tour","unavailable","unique","unlimited","agreement","alliance","annotated","annulment","arbitration","bid","challenging","collaborate","compromise","contract","cooperatively","deadlock","dispute","embark","expire","foundation","impartially","imperative","impression","initially","mediation","moderator","modify","narrow","negotiation","opposing","originally","preamble","proceed","proposal","provision","renew","review","rigid","settle","solicit","stipulation","surely","term","terminate","acclaim","antitrust","assure","at the latest","attain","bulk","capitalize on","commodity","completely","confirmation","consignment","contact","cultivation","dealer","depot","diminish","distribute","diversified","do business with","encompass","engrave","enviable","inevitable","inventory","invoice","keep track of","order","provide","quote","refuse","represent","retail","satisfactory","selection","short","shortly","stock","subject","supply","temporarily","unable","accelerate","acknowledge","address","adequately","affix","attach","bilateral","by hand","carton","caution","convenience","correspondence","courier","deliver","detach","efficient","embargo","enact","enclose","ensure","envelope","expedite","fragile","handle","impose","inaugurate","incorrect","oblige","particularly","perishable","postage","recipient","reciprocal","remarkable","retaliation","shipment","step","surplus","accommodate","agreeably","ahead","amenity","assorted","atmosphere","available","belongings","check in","chef","choice","compensate","complication","complimentary","confirm","connoisseur","container","conveniently","cuisine","dignitary","elegant","entirely","extensive","flavor","forfeit","freshness","indigenous","make","occupancy","polish","rate","reception","recipe","reservation","retain","stir","taste","utensil","anticipate","decline","decrease","demoralize","depend","deviate","disappointing","encouraging","exceed","factor","figure","growth","illustrate","impressive","inaccurate","increase","incur","indicative","infusion","make up for","markedly","meagerly","minimally","offset","percentage","production","profit","projection","proportion","recent","reduce","regular","representative","revenue","sale","significantly","slightly","substantial","summarize","tend","unusually","accountant","accurately","allocate","amend","audit","barely","budget","calculate","committee","compare","curtail","deduct","deficient","deficit","discrepancy","excess","exempt","expenditure","financial","fiscal","fund","generate","in the red","incidental","inconsistency","inflation","ledger","liability","liable","monetary","outlay","overcome","preferred","recently","reimburse","rigorously","spend","stringently","substantially","total","turnover","worth","accept","acquire","active","allegedly","announce","asset","authority","clout","considerable","contingent","contribute","dedicated","emerge","enhance","establish","established","expansion","force","foresee","go through","independent","informed","initiate","interested","liquidate","merge","premier","productivity","progressive","relocate","reveal","run","simultaneously","stance","strategic","strike","struggle","subsidize","surpass","takeover","uncertain","waive","aid","chance","clear","conserve","contaminate","continually","damage","deciduous","deplete","disaster","discharge","dispose","drought","ecology","emission","endangered","environmental","extinction","flood","forecast","fumes","habitat","ideal","inclement","inflict","meteorological","migration","mining","occur","organization","pollutant","precipitation","prominent","purify","recycling","resource","sewage","shower","solution","southern","vague","waste","account","accrue","amount","balance","belatedly","bill","bounce","cash","collateral","confiscate","convert","counterfeit","curb","delinquent","deposit","deterrent","document","due","expect","heavily","identification","in common","interest","investigation","loan","lower","mortgage","overdue","owe","owing to","payable","personal","previously","regrettably","relation","scrutinize","statement","study","sustain","transaction","turn down","unexpected","withdrawal","bond","cautiously","confusion","consider","controversy","depreciation","devastate","dividend","entrepreneur","eventually","foreseeable","increasing","inherently","innate","insecure","investor","justify","legacy","lucrative","manipulation","nearly","on behalf of","out look","outweigh","pitfall","plummet","portfolio","possible","prevalent","property","rapid","shareholder","solely","somewhat","speculation","stability","unbiased","unprecedented","unwillingness","yield","alleviate","alternative","average","bear","cite","clearly","commute","conform","congestion","designated","detailed","detour","divert","emphatic","equip","expense","fare","fine","fuel","gratuity","malfunction","motivate","normal","obstruct","obtain","official","opportunity","opposite","opposition","permit","principal","prominently","reserved","reverse","securely","simply","thereafter","tow","transportation","vehicle","abbreviate","adjourn","agenda","attention","brief","coherent","comment","confine","consensus","constraint","constructive","convene","convince","coordination","defer","differ","discuss","disperse","distract","easy","elaborate","emphasis","faction","give","hold back","illegible","irrelevant","judge","mention","object","opponent","organize","persuasive","preside","press","presumably","refute","succinct","suggestion","unanimous","understanding","uphold","usually","annual","arise","attend","attendee","chronological","commence","conference","conjunction","customize","discriminate","earn","enroll","entry","exhibitor","existing","exploit","function","give in","honor","host","include","labor","leave","lecture","morale","objective","participant","purpose","refer","regard","registration","reimbursement","require","respectfully","responsibility","result","schedule","tentative","union","unused","above all","appoint","appraisal","appreciation","award","characteristic","congratulate","cordially","dedication","delicate","early","encouragement","evaluate","exceptional","incompetent","lay off","level","nomination","participation","performance","praise","predecessor","predict","progress","promote","put in for","radically","reorganize","resignation","reward","search","serve","skilled","stand in for","strictly","transfer","undoubtedly","adjacent","annex","arrange","community","complex","compulsory","consist","construction","currently","delay","demolish","densely","describe","desirable","district","drape","finally","furnished","install","insulation","interfere","location","maintain","numerous","overprice","permanent","premises","presently","renewal","renovation","repair","residence","restore","spacious","structure","tenant","unoccupied","urban","utility","antibiotic","asthma","checkup","chronic","combination","comprehensive","conscious","coverage","deprivation","deter","diagnosis","dose","duration","eliminate","eradicate","exposure","fatigue","forbid","health","immune","induce","inhalation","insurance","join","medicinal","nutrition","periodically","pharmaceutical","physician","premium","prescribe","prevention","prolonged","reaction","recommend","recovery","relieve","remedy","robust","susceptible","symptom"];

  var randomIndexOne = Math.floor(Math.random() * words.length);
  var randomIndexTwo = Math.floor(Math.random() * words.length);
  var randomIndexThree = Math.floor(Math.random() * words.length);
  var buttons = [
          {
            "type":"postback",
            "title":dic[words[randomIndexTwo]],
            "payload":words[randomIndexOne] + '|' + dic[words[randomIndexTwo]]
          },
          {
            "type":"postback",
            "title":dic[words[randomIndexOne]],
            "payload":words[randomIndexOne] + '|' + dic[words[randomIndexOne]]
          },
          {
            "type":"postback",
            "title":dic[words[randomIndexThree]],
            "payload":words[randomIndexOne] + '|' + dic[words[randomIndexThree]]
          }
        ]

  var message = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":words[randomIndexOne] + '의 뜻은?',
        "buttons":shuffle(buttons)
      }
    }
  }

  return message;
}

// console.log(JSON.stringify(messageGenerator()));
