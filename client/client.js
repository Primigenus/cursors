Meteor.startup(function() {
  Meteor.subscribe("cursors");
  Meteor.subscribe("gradients");

  $("#name input").focus();
  Session.setDefault("date", new Date());
  Meteor.call("getServerTime", function(err, res) {
    Session.set("date", res);
    Meteor.setInterval(function() {
      Session.set("date", new Date(+Session.get("date") + 1000));
    }, 1000);
  });

});

Template.body.helpers({
  fill: function() {
    var sessionId = Meteor.connection._lastSessionId;
    var date = Session.get('date');
    var fill = window.fill(sessionId, +date);
    return fill;
  }
});

var throttleUpdate;
Template.body.events({
  "mousemove #body": function(evt) {
    var sessionId = Meteor.connection._lastSessionId;
    if (!sessionId)
      return;

    var x = evt.clientX;
    var y = evt.clientY;
    var c = Cursors.findOne(sessionId);

    if (c) {
      throttleUpdate = throttleUpdate || _.throttle(function(sessionId, x, y) {
        Cursors.update(sessionId, {$set: {x: x, y: y}});
      }, 42);
      throttleUpdate(sessionId, x, y);
    }
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
    Gradients.insert({createdBy: sessionId, x: x, y: y, fill: fill});
  },
  "mouseup #body": function(evt) {
    var sessionId = Meteor.connection._lastSessionId;
    if (!sessionId)
      return;

    var c = Cursors.findOne(sessionId);
    if (c)
      Meteor.call("updateCursorClick", sessionId, false);
  },
  "click a": function() {
    var sessionId = Meteor.connection._lastSessionId;
    Meteor.call("removeCursor", sessionId);
  }
});

Template.username.events({
  "input #name input": function(evt) {
    var sessionId = Meteor.connection._lastSessionId;
    if (!sessionId)
      return;
    Meteor.call("updateCursorName", sessionId, $(evt.target).val());
  }
});
Template.username.helpers({
  name: function() {
    return this.name;
  }
});

Template.gradients.helpers({
  gradient: function() {
    return Gradients.find();
  },
  opacity: function() {
    var age = (+Session.get("date") - +this.createdOn) / 1000;
    if (age > 30) return 0;
    if (age > 25) return 0.1;
    if (age > 20) return 0.15;
    if (age > 10) return 0.2;
    if (age > 5)  return 0.25;
    if (age > 2)  return 0.3;
    return 0.35;
  }
});

Template.cursors.helpers({
  cursor: function() {
    return Cursors.find();
  },
  fill: function() {
    return fill(this._id);
  },
  isMyCursor: function() {
    return Meteor.connection._lastSessionId === this._id;
  },
  name: function() {
    return this.name;
  },
  opacity: function() {
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
  },
  blur: function() {
    if (Meteor.connection._lastSessionId === this._id)
      return 0;
    var age = (+Session.get("date") - +this.lastSeen) / 1000;
    return ~~(age / 3);
  }
});

var justClickedToh;
Template.cursors.helpers({
  clicking: function() {
    if (this.clicking) {
      var $c = $(".id-" + this._id);
      $c.addClass("just-clicked");
      justClickedToh = Meteor.setTimeout(function() {
        $c.removeClass("just-clicked");
      }, 200);
    }
    return Meteor.connection._lastSessionId === this._id && this.clicking ? "clicking" : "";
  }
});

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
