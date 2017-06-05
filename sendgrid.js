//console.log(process.env.SENDGRID_API_KEY)
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

exports.sendEmail = function(from, to, subject, body){
  var helper = require('sendgrid').mail;
  var fromEmail = new helper.Email(from);
  var toEmail = new helper.Email(to);
  var subject = subject;
  var content = new helper.Content('text/plain', body);
  var mail = new helper.Mail(fromEmail, subject, toEmail, content);

  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });


  sg.API(request, function (error, response) {
    if (error) {
      console.log('Error response received');
    }
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
  });
}
