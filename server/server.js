Meteor.startup(function() {
    Meteor.publish("cursors", function() {
      return Cursors.find({lastSeen: {$gte: new Date(new Date() - 1000 * 42)}});
    });
    Meteor.publish("gradients", function() {
      return Gradients.find();
    })

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