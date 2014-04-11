Cursors = new Meteor.Collection("cursors");

if (Meteor.isClient) {
  Meteor.startup(function() {
    console.log("Startup4");
  })
  Template.cursors.cursor = function() {
    return Cursors.find();
  }
  UI.body.events({
    "mousemove #body": function(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      var sessionId = Meteor.connection._lastSessionId;
      var c = Cursors.findOne(sessionId);
      if (c)
        Cursors.update(sessionId, {$set: {x: x, y: y}});
      else
        Cursors.insert({_id: sessionId, x: x, y: y});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    if (Cursors.find().count() > 100) {
      Cursors.remove({});
    }
  })
}