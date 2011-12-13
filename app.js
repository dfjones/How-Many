var twitter = require("ntwitter");
var creds = require("./creds");

var twit = new twitter(creds.creds);

twit.verifyCredentials(function (err, data) {
  if (err) {
    console.log(err);
  }
  //console.log(data);
});

twit.stream("statuses/filter", { follow: creds.followId }, function(stream) {
  stream.on("data", function (data) {
    console.log(data);
    var user = data.user;
    var status = data;

    if (status && status.in_reply_to_screen_name === creds.username) {

      var message = status.text;
      var mbody = message;

      if (message.indexOf("@") >= 0) {
        mbody = message.substring(message.indexOf(" ", message.indexOf("@")));
      }

      console.log("mbody: ", mbody);

      var response = genMessage(mbody);
      twit.updateStatus("@" + user.screen_name + " " + response, {
        in_reply_to_status_id: status.id
      }, function (err, data) {
        if (err) {
          console.log("Error: ", err);
        }
        console.log("Data: ", data);
      });
    }

  });
});

// Best matrix ever
var drinkMatrix = {
  "cool": {
    "boss": 3,
    "senior mgmt": 3,
    "labor": 4,
    "middle mgmt": 3,
    "cog": 8,
    "entry": 3,
    "intern": 2
  },

  "uncool": {
    "boss": 4,
    "senior mgmt": 1,
    "labor": 5,
    "middle mgmt": 2,
    "cog": 8,
    "entry": 3,
    "intern": 0
  },

  "bonus": {
    "boss": 1,
    "no food": -2,
    "meeting": -1,
    "shareholders": -1,
    "crush": 1,
    "wrestling": 3
  }
};

var errorText = "For help try: 'company?' or 'me?' or 'bonus?'. Need to specify company and me like 'company: cool, me: cog'";

var keywords = {
  "company": function (val) {
    if (val === "cool") {
      return drinkMatrix["cool"];
    }
    else if (val === "uncool") {
      return drinkMatrix["uncool"];
    }
    return null;
  },

  "bonus": function(val) {
    return drinkMatrix["bonus"][val];
  }
};

var genMessage = function(m) {
  if (m.indexOf('?') !== -1) {
    var key = m.split('?')[0];
    var vals = [];
    console.log(key);
    switch (key) {
      case "company":
        vals = ["cool", "uncool"];
        break;
      case "me":
        vals = Object.keys(drinkMatrix["cool"]);
        break;
      case "bonus":
        vals = Object.keys(drinkMatrix["bonus"]);
        break;
    }

    return vals.join(', ')
  }
  else if (m.indexOf(':')) {
    var parts = m.split(',');
    var pairs = {};
    parts.forEach(function (p) {
      var pair = p.split(':');
      if (pair.length === 2) {
        pairs[pair[0].trim()] = pair[1].trim();
      }
      else {
        return errorText;
      }
    });
    console.log(pairs);

    var pairKeys = Object.keys(pairs);
    console.log(pairKeys);
    if (isIn(pairKeys, "company")) {
      var total = 0;

      var dm = keywords["company"](pairs["company"]);
      if (isIn(pairKeys, "me") && isIn(Object.keys(dm), pairs["me"])) {
        total += dm[pairs["me"]];
      }

      if (isIn(pairKeys, "bonus") && 
        isIn(Object.keys(drinkMatrix["bonus"]), pairs["bonus"])) {
        total += drinkMatrix["bonus"][pairs["bonus"]];
      }

      if (total > 1) {
        return "Have " + total + " drinks!";
      }
      else if (total === 1) {
        return "Have 1 drink.";
      }
      else if (total === 0) {
        return "Have 0 drinks :-(";
      }
      else {
        return "Puke up " + total * -1 + " drinks!";
      }

    }
    else {
      return errorText;
    }
  }
  else {
    return errorText;
  }

}

var isIn = function(arr, key) {
  return (arr.indexOf(key) !== -1);
}

exports.genMessage = genMessage;
