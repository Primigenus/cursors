Cursors = new Meteor.Collection("cursors");

if (Meteor.isClient) {

  Meteor.startup(function() {
    Session.setDefault("sessionId", Meteor.connection._lastSessionId);
  })

  UI.body.events({
    "mousemove #body": function(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      var sessionId = Session.get("sessionId");
      var lastSeen = new Date();
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {x: x, y: y, lastSeen: lastSeen}});
      else
        Cursors.insert({_id: sessionId, x: x, y: y, lastSeen: lastSeen});
    }
  });

  Template.cursors.cursor = function() {
    return Cursors.find();
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
    return Session.equals("sessionId", this._id);
  }
  Template.cursors.opacity = function() {
    var age = (+new Date() - +this.lastSeen) / 1000;
    if (age > 30) return 0;
    if (age > 20) return 0.3;
    if (age > 10) return 0.5;
    if (age > 5)  return 0.8;
    if (age > 2)  return 0.9;
    return 1;
  }
  Template.cursors.blur = function() {
    var age = (+new Date() - +this.lastSeen) / 1000;
    if (age > 30) return 3;
    if (age > 20) return 2;
    if (age > 10) return 1;
    if (age > 5)  return 0.7;
    if (age > 2)  return 0.3;
    return 0;
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
  })
}
