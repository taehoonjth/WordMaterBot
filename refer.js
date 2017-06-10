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

var apiRoot = 'https://wordsapiv1.p.mashape.com/words/';
$(document).ready(function() {
  $("#getWord").click(function(e) {
    e.preventDefault();
    $("#word").focus().parent().removeClass("has-error");
    var word = $("#word").val();
    if (word) {
      if (typeof _gaq !== "undefined") {
        _gaq.push(['_trackEvent', 'web', 'demo', word]);
      }
      var resultType = $("#resultType").val();
      var request = word;
      var url = apiRoot + word;
      if (resultType) {
        url += "/" + resultType;
        request += "/" + resultType;
      }
      $("#json pre code").html("Getting results...");
      $("#requestUrl").val(url);
      $.ajax({
        url: "/mashape/words/" + request + "?when=" + when + "&encrypted=" + encrypted,
        method: 'GET',
        dataType: 'json',
        success: function(result) {
          if (!resultType) {
            var definitions = result.results;
            if (definitions) {
              definitions.forEach(function(definition) {
                _.each(definition, function(value, key) {
                  if (_.isArray(definition[key]) && key != "examples") {
                    var arr = value;
                    for (var i = 0, len = arr.length; i < len; i++) {
                      if (_.isString(arr[i])) {
                        arr[i] = "<a class='exampleLink' href='#'>" + arr[i] + "</a>"
                      }
                    }
                  }
                });
              });
            }
          } else {
            var arr = result[resultType];
            for (var i = 0, len = arr.length; i < len; i++) {
              if (_.isString(arr[i])) {
                arr[i] = "<a class='exampleLink' href='#'>" + arr[i] + "</a>"
              }
            }
          }
          var formatted = JSON.stringify(result, null, '  ');
          $("#json pre code").html(formatted);
          $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
          });
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (jqXHR.status === 404) {
            $("#json pre code").html("No results for that word.");
          } else {
            $("#json pre code").html("Please refresh the page.");
          }
        }
      });
    } else {
      $("#word").parent().addClass("has-error");
    }
  });
  $(document).on("click", "a.exampleLink", function(e) {
    e.preventDefault();
    var word = $(this).text();
    var type = $(this).data('type') || '';
    $("#word").val(word);
    $("#resultType").val(type);
    $("#getWord").click();
  });
  $("#word").val('example');
  $("#getWord").click();
});




var word = 'sex';
if (word) {
  if (typeof _gaq !== "undefined") {
    _gaq.push(['_trackEvent', 'web', 'demo', word]);
  }
  var resultType = $("#resultType").val();
  var request = word;
  var url = apiRoot + word;
  if (resultType) {
    url += "/" + resultType;
    request += "/" + resultType;
  }
  $("#json pre code").html("Getting results...");
  $("#requestUrl").val(url);
  $.ajax({
    url: "/mashape/words/" + request + "?when=" + when + "&encrypted=" + encrypted,
    method: 'GET',
    dataType: 'json',
    success: function(result) {
      console.log(JSON.stringify(result));
    },
    error: function(jqXHR, textStatus, errorThrown) {
      if (jqXHR.status === 404) {
        $("#json pre code").html("No results for that word.");
      } else {
        $("#json pre code").html("Please refresh the page.");
      }
    }
  });
} else {
  $("#word").parent().addClass("has-error");
}

var dataSet = [];
var index = 0;

var requestFunc = function() {
  var word = words[index];
  index++;
  if (word) {
    if (typeof _gaq !== "undefined") {
      _gaq.push(['_trackEvent', 'web', 'demo', word]);
    }
    var resultType = $("#resultType").val();
    var request = word;
    var url = apiRoot + word;
    if (resultType) {
      url += "/" + resultType;
      request += "/" + resultType;
    }
    $("#json pre code").html("Getting results...");
    $("#requestUrl").val(url);
    $.ajax({
      url: "/mashape/words/" + request + "?when=" + when + "&encrypted=" + encrypted,
      method: 'GET',
      dataType: 'json',
      success: function(result) {
        dataSet.push(result);
        console.log(`pushed ${result["word"]}`)
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 404) {
          $("#json pre code").html("No results for that word.");
        } else {
          $("#json pre code").html("Please refresh the page.");
        }
      }
    });
  } else {
    $("#word").parent().addClass("has-error");
  }
};

setInterval(requestFunc, 500);







