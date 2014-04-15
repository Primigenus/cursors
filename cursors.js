Cursors = new Meteor.Collection("cursors");

if (Meteor.isClient) {

  Meteor.startup(function() {
    Session.setDefault("date", new Date());
    Meteor.setInterval(function() {
      Session.set("date", new Date());
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
        Cursors.insert({_id: sessionId, x: x, y: y, lastSeen: lastSeen, name: "Anonymous"});
    }
  });

  Template.name.events({
    "input #name input": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      Cursors.update(sessionId, {$set: {name: $(evt.target).val()}});
    }
  });
  Template.name.name = function() {
    return this.name;
  }

  Template.cursors.cursor = function() {
    return Cursors.find({lastSeen: {$gte: new Date(new Date() - 1000 * 305)}});
  }
  Template.cursors.name = function() {
    return this.name;
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
    if (age > 300) return 0;
    if (age > 200) return 0.3;
    if (age > 100) return 0.5;
    if (age > 50) return 0.8;
    if (age > 10)  return 0.9;
    return 1;
  }
  Template.cursors.blur = function() {
    if (Meteor.connection._lastSessionId === this._id)
      return 0;
    var age = (+Session.get("date") - +this.lastSeen) / 1000;
    if (age > 300) return 10;
    if (age > 200) return 7;
    if (age > 100) return 4;
    if (age > 50) return 2;
    if (age > 10)  return 1;
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
  });

  Meteor.methods({
    clear: function() {
      Cursors.remove({});
    }
  })
}
