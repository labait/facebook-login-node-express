var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  firtsname: String,
  lastname: String,
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
