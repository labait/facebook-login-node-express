var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  code: String,
  sent: Boolean
});


var Code = mongoose.model('Code', UserSchema);

module.exports = {
  Code: Code
}
