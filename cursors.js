Cursors = new Meteor.Collection("cursors");
Gradients = new Meteor.Collection("gradients");

if (Meteor.isClient) {

  Meteor.startup(function() {
    $("#name input").focus();
    Session.setDefault("date", new Date());
    Meteor.setInterval(function() {
      Meteor.call("getServerTime", function(err, res) {
        Session.set("date", res);
      });
    }, 1000);
  });

  UI.body.fill = function() {
    var sessionId = Meteor.connection._lastSessionId;
    var date = Session.get('date');
    var fill = window.fill(sessionId, +date);
    return fill;
  }

  UI.body.events({
    "mousemove #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;

      var x = evt.clientX;
      var y = evt.clientY;
      var c = Cursors.findOne(sessionId);
      if (c)
        Meteor.call("updateCursor", sessionId, x, y);
      else
        Meteor.call("createCursor", sessionId, x, y);
    },
    "mousedown #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;

      var c = Cursors.findOne(sessionId);
      if (c)
        Meteor.call("updateCursorClick", sessionId, true);

      var fill = window.fill(sessionId);
      var x = evt.clientX - 100;
      var y = evt.clientY - 100;
      Meteor.call("createGradient", sessionId, x, y, fill)
    },
    "mouseup #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;

      var c = Cursors.findOne(sessionId);
      if (c)
        Meteor.call("updateCursorClick", sessionId, false);
    }
  });

  Template.name.events({
    "input #name input": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;
      Meteor.call("updateCursorName", sessionId, $(evt.target).val());
    }
  });
  Template.name.name = function() {
    return this.name;
  }

  Template.gradients.gradient = function() {
    return Gradients.find();
  }
  Template.gradients.opacity = function() {
    var age = (+Session.get("date") - +this.createdOn) / 1000;
    if (age > 30) return 0;
    if (age > 25) return 0.1;
    if (age > 20) return 0.15;
    if (age > 10) return 0.2;
    if (age > 5)  return 0.25;
    if (age > 2)  return 0.3;
    return 0.35;
  }

  Template.cursors.cursor = function() {
    return Cursors.find({lastSeen: {$gte: new Date(Session.get("date") - 1000 * 42)}});
  }
  Template.cursors.fill = function() {
    return fill(this._id);
  }
  Template.cursors.isMyCursor = function() {
    return Meteor.connection._lastSessionId === this._id;
  }
  Template.cursors.name = function() {
    return this.name;
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
    if (this.clicking) {
      var $c = $(".id-" + this._id);
      $c.addClass("just-clicked");
      justClickedToh = Meteor.setTimeout(function() {
        $c.removeClass("just-clicked");
      }, 200);
    }
    return Meteor.connection._lastSessionId === this._id && this.clicking ? "clicking" : "";
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
    Meteor.setInterval(function() {
      Cursors.remove({lastSeen: {$lt: new Date(new Date() - 1000 * 3600)}});
      Gradients.remove({createdOn: {$lt: new Date(new Date() - 1000 * 300)}});
    }, 10000)
  });

  Meteor.methods({
    clear: function() {
      Cursors.remove({});
      Gradients.remove({});
    },
    getServerTime: function () {
      return new Date();
    },
    updateCursor: function(sessionId, x, y) {
      Cursors.update(sessionId, {$set: {x: x, y: y, lastSeen: new Date()}})
    },
    updateCursorClick: function(sessionId, clicking) {
      Cursors.update(sessionId, {$set: {clicking: clicking, lastSeen: new Date()}});
    },
    updateCursorName: function(sessionId, name) {
      Cursors.update(sessionId, {$set: {name: name}});
    },
    createCursor: function(sessionId, x, y) {
      if (!Cursors.findOne(sessionId))
        Cursors.insert({_id: sessionId, x: x, y: y, lastSeen: new Date()});
    },
    createGradient: function(sessionId, x, y, fill) {
      Gradients.insert({createdBy: sessionId, createdOn: new Date(), x: x, y: y, fill: fill});
    }
  })
}
