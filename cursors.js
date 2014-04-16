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

  UI.body.events({
    "mousemove #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;

      var x = evt.clientX;
      var y = evt.clientY;
      var lastSeen = Session.get("date");
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {x: x, y: y, lastSeen: lastSeen}});
      else
        Cursors.insert({_id: sessionId, x: x, y: y, lastSeen: lastSeen});
    },
    "mousedown #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;

      var lastSeen = Session.get("date");
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {clicking: true, lastSeen: lastSeen}});

      var fill = window.fill(sessionId);
      var x = evt.clientX - 100;
      var y = evt.clientY - 100;
      Gradients.insert({createdOn: Session.get("date"), x: x, y: y, fill: fill});
    },
    "mouseup #body": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;

      var lastSeen = Session.get("date");
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {clicking: false, lastSeen: lastSeen}});
    }
  });

  Template.name.events({
    "input #name input": function(evt) {
      var sessionId = Meteor.connection._lastSessionId;
      if (!sessionId)
        return;
      Cursors.update(sessionId, {$set: {name: $(evt.target).val()}});
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
    }
  })
}
