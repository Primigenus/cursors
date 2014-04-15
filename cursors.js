Cursors = new Meteor.Collection("cursors");

if (Meteor.isClient) {

  Meteor.startup(function() {

    Session.setDefault("date", new Date());
    Meteor.setInterval(function() {
      Meteor.call("getServerTime", function(err, res) {
        Session.set("date", res);
      });
    }, 1000);

  })

  UI.body.events({
    "mousemove #body": function(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      var sessionId = Meteor.connection._lastSessionId;
      var lastSeen = new Date();
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {x: x, y: y, lastSeen: lastSeen}});
      else
        Cursors.insert({_id: sessionId, x: x, y: y, lastSeen: lastSeen});
    },
    "mousedown #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {clicking: true}});
    },
    "mouseup #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {clicking: false}});
    }
  });

  Template.cursors.cursor = function() {
    return Cursors.find({lastSeen: {$gte: new Date(new Date() - 1000 * 42)}});
  }
  Template.cursors.fill = function() {
    var stringHexNumber = (
        parseInt(
            parseInt(this._id, 36)
                .toExponential()
                .slice(2,-5)
        , 10) & 0xFFFFFF
    ).toString(16).toUpperCase();
    return stringHexNumber;
  }
  Template.cursors.isMyCursor = function() {
    return Meteor.connection._lastSessionId === this._id;
  }
  Template.cursors.opacity = function() {
    if (Meteor.connection._lastSessionId === this._id)
      return 1;
    var age = (+Session.get("date") - +this.lastSeen) / 1000;
    if (age > 30) return 0;
    if (age > 25) return 0.15;
    if (age > 20) return 0.3;
    if (age > 10) return 0.5;
    if (age > 5)  return 0.8;
    if (age > 2)  return 0.9;
    return 1;
  }
  Template.cursors.blur = function() {
    if (Meteor.connection._lastSessionId === this._id)
      return 0;
    var age = (+Session.get("date") - +this.lastSeen) / 1000;
    return ~~(age / 3);
  }

  var justClickedToh;
  Template.cursors.clicking = function() {
    var clicking = Meteor.connection._lastSessionId === this._id && this.clicking;
    if (clicking) {
      var $c = $(".id-" + this._id);
      $c.addClass("just-clicked");
      justClickedToh = Meteor.setTimeout(function() {
        $c.removeClass("just-clicked");
      }, 200);
    }
    return clicking ? "clicking" : "";
  }

  String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    if (Cursors.find().count() > 100) {
      Cursors.remove({});
    }
    Meteor.setInterval(function() {
      Cursors.remove({lastSeen: {$lt: new Date(new Date() - 1000 * 3600)}})
    }, 10000)
  });

  Meteor.methods({
    clear: function() {
      Cursors.remove({});
    },
    getServerTime: function () {
      return new Date();
    }
  })
}
