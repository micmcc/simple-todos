
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // This code only runs on the client
  //subscribe to server tasks
  Meteor.subscribe("tasks");

  // Template Body Helpers
  Template.body.helpers({
    tasks: function () {
      if (Session.get("hideCompleted")){
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    incompletCount: function(){
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  // Template Body Events
  Template.body.events({
    "submit .new-task": function(event){
      // called when new task form is submitted
      var text = event.target.text.value;
      Meteor.call("addTask", text);
      //clear the form
      event.target.text.value = "";

      //prevent default form submit
      return false;
    },
    "change .hide-completed input": function (event){
      Session.set("hideCompleted", event.target.checked);
    }
  });

  // Template Task Events
  Template.task.events({
    "click .toggle-checked": function () {
    // set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function (){
      Meteor.call("setPrivate", this._id, ! this.private);
    }

  });

  // Template Task Helpers
  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  // Set login
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

// Meteor Call Methods
Meteor.methods({
    // add a new task to the DB
    addTask: function (text){
      //ensure user is logged in before inserting task in db
      if (! Meteor.userId()){
        throw new Meteor.Error("not-authorized");
      }
      Tasks.insert({
        text: text,
        createdAt: new Date(),
        owner: Meteor.userId(),
        username: Meteor.user().username
      });
    },
    // Remove a task from the DB
    deleteTask: function (taskId) {
      if (! Meteor.userId()){
        throw new Meteor.Error("not-authorized");
      }

      var task = Tasks.findOne(taskId);
      if (task.private && task.owner !== Meteor.userId()){
        throw new Meteor.Error("not-authorized");
      }

      Tasks.remove(taskId);
    },
    // Set a task as completed
    setChecked: function (taskId, setChecked){
      if (! Meteor.userId()){
        throw new Meteor.Error("not-authorized");
      }

      var task = Tasks.findOne(taskId);
      if (task.private && task.owner !== Meteor.userId()){
        throw new Meteor.Error("not-authorized");
      }
      
      Tasks.update(taskId, {$set: {checked: setChecked} });
    },
    setPrivate: function (taskId, setToPrivate){
      var task = Tasks.findOne(taskId);
      if (task.owner !== Meteor.userId()){
        throw new Meteor.Erro("not-authorized");
      }
      Tasks.update(taskId, {$set: {private: setToPrivate} });
    }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("tasks", function (){
    return Tasks.find({
      $or: [
          {private: {$ne: true}},
          {owner: this.userId}
      ]
    });
  });
}
