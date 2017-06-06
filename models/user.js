var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  fbid: {
    type: String,
    index: true
  }
});


var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User
}
