
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect(
{
	host 	    : process.env.NL_EMAIL_HOST || 'smtp.gmail.com',
	user 	    : process.env.NL_EMAIL_USER || 'service.dnamovies@gmail.com',
	password    : process.env.NL_EMAIL_PASS || 'dnamovies!',
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : process.env.NL_EMAIL_FROM || 'IET <do-not-reply@gmail.com>',
		to           : account.email,
		subject      : 'IET - Please reset your password',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.contactUsEmailSent = function(email, message, user, callback)
{
	let baseurl = process.env.NL_SITE_URL || 'http://localhost:3005';
	var html = "<link href='https://fonts.googleapis.com/css?family=Varela+Round' rel='stylesheet' type='text/css'>\n" +
		"<td align=\"center\" valign=\"top\" style=\"font-size:11px;font-family:Arial,Verdana,sans-serif\">\n" +
		"    <table width=\"620\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\">\n" +
		"        <tbody><tr id=\"m_-1286596109655824635top\">\n" +
		"            <td>\n" +
		"                <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">\n" +
		"                    <tbody><tr>\n" +
		"                        <td style=\"text-align:left;padding:15px 0px 0px 20px\">&nbsp;</td>\n" +
		"                    </tr>\n" +
		"                </tbody></table>\n" +
		"            </td>\n" +
		"        </tr>\n" +
		"        <tr>\n" +
		"            <td style=\"padding:0 3px\">\n" +
		"                <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border: 3px solid #5E798B;width:100%;text-align:left; font-family: 'Varela Round', sans-serif;\" bgcolor=\"#ffffff\" >\n" +
		"                    <tbody><tr>\n" +
		"                        <td>\n" +
		"                            <table cellpadding=\"3\" cellspacing=\"0\" border=\"0\" height=\"100\" style=\" border-bottom: 3px solid #5E798B;width:100%;height:100px\" bgcolor=\"#5E798B\">\n" +
		"                                <tbody><tr>\n" +
		"                                    <td valign=\"middle\" style=\"width: 500px;\">\n" +
		"                                        <a href=\"http://localhost:3005\"><img src=\"https://i.ibb.co/KXzKSzm/Screenshot-2021-04-02-191708.png\" height=\"100\" alt=\"logo\"/>\n" +
		"                                    </td>\n" +
		"                                </tr>\n" +
		"                            </tbody></table>\n" +
		"                        </td>\n" +
		"                    </tr>\n" +
		"                    <tr>\n" +
		"                        <td valign=\"middle\">\n" +
		"                            <table cellpadding=\"20\" cellspacing=\"0\" border=\"0\" style=\"width:100%;height:250px;font-family: 'Varela Round', sans-serif\">\n" +
		"                                <tbody><tr>\n" +
		"                                    <td valign=\"top\">\n" +
		"                                        <h1 style=\"font-family: 'Varela Round', sans-serif;font-size:22px;color:#555555\">.Message From : "+user.name+"<br>\n" +
		"                                        </h1 >\n" +
		"                                        <h1 style=\"font-family: 'Varela Round', sans-serif;font-size:22px;color:#555555\">Email: <b><a href="+"mailto:"+user.email+">"+user.email+"</a></b><br></h1 >\n" +
		"                                        <h1 style=\"font-family: 'Varela Round', sans-serif;font-size:22px;color:#555555\">:Message <br></h1 >\n" +
		"                                        <div style=\"color:#555555;font-size:14px;line-height:20px\">\n" + message +
		"                                        </div>\n" +
		"                                    </td>\n" +
		"                                </tr>\n" +
		"                            </tbody></table>\n" +
		"                        </td>\n" +
		"                    </tr>\n" +
		"                    <tr bgcolor=\"#5E798B\" width=\"100%\">\n" +
		"                        <td align=\"center\" valign=\"top\" style=\"font-size:11px;font-family:Arial,Verdana,sans-serif;color:#FFFFFF\">\n" +
		"                            <table cellspacing=\"0\" border=\"0\" cellpadding=\"0\" width=\"100%\">\n" +
		"                                <tbody><tr>\n" +
		"                                    <td align=\"left\" valign=\"middle\" style=\"padding:10px 20px 20px 20px;font-size:11px;line-height:20px;font-family:Arial,Verdana,sans-serif;color:#FFFFFF\">\n" +
		"                                        .Replies to this email are not monitored\n" +
		"                                        <br>\n" +
		"                                        <br>\n" +
		"                                        © IET Inc, Ofakim Israel, 87588</td>\n" +
		"                                </tr>\n" +
		"                            </tbody></table>\n" +
		"                        </td>\n" +
		"                    </tr>\n" +
		"                </tbody></table>\n" +
		"                <br>\n" +
		"                <br>\n" +
		"            </td>\n" +
		"        </tr>\n" +
		"    </tbody></table>\n" +
		"</td>"
	EM.server.send({
		from         : process.env.NL_EMAIL_FROM || 'IET <do-not-reply@gmail.com>',
		to           : email,
		subject      : 'IET - Contact - from: ' + user.name,
		attachment   : [{data:html, alternative:true}]
	}, callback );
}

EM.composeEmail = function(o)
{
	let baseurl = process.env.NL_SITE_URL || 'http://localhost:3005';
	var html = "<link href='https://fonts.googleapis.com/css?family=Varela+Round' rel='stylesheet' type='text/css'>\n" +
		"\n" +
		"<td align=\"center\" valign=\"top\" style=\"font-size:11px;font-family:Arial,Verdana,sans-serif\">\n" +
		"    <table width=\"620\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\">\n" +
		"        <tbody><tr>\n" +
		"            <td>\n" +
		"                <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">\n" +
		"                    <tbody><tr>\n" +
		"                        <td style=\"text-align:left;padding:15px 0px 0px 20px\">&nbsp;</td>\n" +
		"                    </tr>\n" +
		"                </tbody></table>\n" +
		"            </td>\n" +
		"        </tr>\n" +
		"        <tr>\n" +
		"            <td style=\"padding:0 3px\">\n" +
		"                <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border: 3px solid #5E798B;width:100%;text-align:left; font-family: 'Varela Round', sans-serif;\" bgcolor=\"#ffffff\" >\n" +
		"                    <tbody><tr>\n" +
		"                        <td>\n" +
		"                            <table cellpadding=\"3\" cellspacing=\"0\" border=\"0\" height=\"100\" style=\" border-bottom: 3px solid #5E798B;width:100%;height:100px\" bgcolor=\"#5E798B\">\n" +
		"                                <tbody><tr>\n" +
		"                                    <td valign=\"middle\" style=\"width: 500px;\">\n" +
		"                                        <a href=\"http://localhost:3005\"><img src=\"https://i.ibb.co/KXzKSzm/Screenshot-2021-04-02-191708.png\" height=\"100\" alt=\"logo\"/>\n" +
		"                                    </td>\n" +
		"                                </tr>\n" +
		"                            </tbody></table>\n" +
		"                        </td>\n" +
		"                    </tr>\n" +
		"                    <tr>\n" +
		"                        <td valign=\"middle\">\n" +
		"                            <table cellpadding=\"20\" cellspacing=\"0\" border=\"0\" style=\"width:100%;height:250px;font-family: 'Varela Round', sans-serif\">\n" +
		"                                <tbody><tr>\n" +
		"                                    <td valign=\"top\">\n" +
		"                                        <h1 style=\"font-size:22px;color:#555555\">Reset your password<br>\n" +
		"                                            <span style=\"font-size:18px\">.Here's what you need to create a new one</span>\n" +
		"                                        </h1>\n" +
		"                                        <div style=\"color:#555555;font-size:12px;line-height:20px\">\n" +
		"                                            :We recently received a request to reset the password to your account  ";
		html += "<b><a style=\"color:#555555;font-weight:bold;text-decoration:none\" href='"+o.email+"'>"+o.email+"</a></b>";
		html += "                                            <br>\n" +
			"                                            <br>\n" +
			"                                            ):To reset your password, click on this link (or copy and paste it into your browser\n" +
			"                                            <br>\n" +
			"                                            <br>";
		html += "<b><a style=\"color:#555555;font-weight:bold;text-decoration:none\" href='"+baseurl+"/?key="+o.passKey+"'>"+baseurl+'/?key='+o.passKey+"</a></b><br><br>";
		html += ".If you did not request to reset your password, simply disregard this email. No changes will be made to your account\n" +
			"                                        </div>\n" +
			"                                    </td>\n" +
			"                                </tr>\n" +
			"                            </tbody></table>\n" +
			"                        </td>\n" +
			"                    </tr>\n" +
			"                    <tr bgcolor=\"#5E798B\" width=\"100%\">\n" +
			"                        <td align=\"center\" valign=\"top\" style=\"font-size:11px;font-family:Arial,Verdana,sans-serif;color:#FFFFFF\">\n" +
			"                            <table cellspacing=\"0\" border=\"0\" cellpadding=\"0\" width=\"100%\" style=\"border-top:1px solid #c0c0c0\">\n" +
			"                                <tbody><tr>\n" +
			"                                    <td align=\"left\" valign=\"middle\" style=\"padding:20px;font-size:11px;line-height:20px;font-family:Arial,Verdana,sans-serif;color:#FFFFFF\">\n" +
			"                                        <strong>:Important Security Notice</strong><br>\n" +
			"                                        .IET never asks for your password or other sensitive information by email\n" +
			"                                        <br>\n" +
			"                                    </td>\n" +
			"                                </tr>\n" +
			"                            </tbody></table>\n" +
			"                        </td>\n" +
			"                    </tr>\n" +
			"                    <tr bgcolor=\"#5E798B\" width=\"100%\">\n" +
			"                        <td align=\"center\" valign=\"top\" style=\"font-size:11px;font-family:Arial,Verdana,sans-serif;color:#666666\">\n" +
			"                            <table cellspacing=\"0\" border=\"0\" cellpadding=\"0\" width=\"100%\">\n" +
			"                                <tbody><tr>\n" +
			"                                    <td align=\"left\" valign=\"middle\" style=\"padding:10px 20px 20px 20px;font-size:12px;line-height:20px;font-family:Arial,Verdana,sans-serif;color:#FFFFFF\">\n" +
			"                                        .Replies to this email are not monitored\n" +
			"                                        <br>\n" +
			"                                        <br>\n" +
			"                                        © IET Inc, Ofakim Israel, 87588</td>\n" +
			"                                </tr>\n" +
			"                            </tbody></table>\n" +
			"                        </td>\n" +
			"                    </tr>\n" +
			"                </tbody></table>\n" +
			"                <br>\n" +
			"                <br>\n" +
			"            </td>\n" +
			"        </tr>\n" +
			"    </tbody></table>\n" +
			"</td>";
	return [{data:html, alternative:true}];
}