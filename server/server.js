Meteor.startup(function() {
  Kadira.connect("swmtn8Fo93uafiH7T", "858fa783-61af-4f8a-aa5a-37bf6f13b796");

  Meteor.publish("cursors", function() {
    return Cursors.find({lastSeen: {$gte: new Date(new Date() - 1000 * 42)}});
  });
  Meteor.publish("brushes", function() {
    return Brushes.find();
  })

  Meteor.setInterval(function() {
    Cursors.remove({lastSeen: {$lt: new Date(new Date() - 1000 * 3600)}});
    Brushes.remove({createdOn: {$lt: new Date(new Date() - 1000 * 300)}});
  }, 10000)

  Cursors.allow({
    update: function(userId, doc, fieldNames, modifier) {
      if (fieldNames.length == 2 && modifier.$set.x !== undefined && modifier.$set.y !== undefined) {
        doc.lastSeen = new Date();
        return true;
      }
      return false;
    }
  });
  Brushes.allow({
    insert: function(userId, doc) {
      if (doc.createdBy && doc.x && doc.y && doc.fill) {
        doc.createdOn = new Date();
        return true;
      }
      return false;
    }
  });
});



Meteor.methods({
  clear: function() {
    Cursors.remove({});
    Brushes.remove({});
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
  removeCursor: function(sessionId) {
    Cursors.remove(sessionId);
  }
})
