
var CF = require('./modules/class-list');
var DBM = require('./modules/manager');
var EM = require('./modules/email-dispatcher');


module.exports = function(app) {

	/*
		Home page
	*/

	app.get('/home', function(req, res) {
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			res.render('home', {
				udata: req.session.user
			});
		}
	});

	/*
        login page
    */
	app.get('/', function(req, res){
		if(req.query['key'] !== undefined) {
			console.log("111");
			DBM.validatePasswordKey(req.query['key'], req.ip, function (e, o) {
				if (o != null) {
					req.session.passKey = req.query['key'];
					res.render('login', {
						popUpPass: true
					});
				} else res.redirect('/');
			});
		}
		else {
			// check if the user has an auto login key saved in a cookie //
			if (req.cookies.login == undefined) {
				res.render('login', {title: 'Hello - Please Login To Your Account'});
			} else {
				// attempt automatic login //
				DBM.validateLoginKey(req.cookies.login, req.ip, function (e, o) {
					if (o) {
						DBM.autoLogin(o.id, o.pass, function (o) {
							req.session.user = o;
							res.redirect('/home');
						});
					} else {
						res.render('login', {title: 'Hello - Please Login To Your Account'});
					}
				});
			}
		}
	});

	app.post('/login', function(req, res){
		DBM.manualLogin(req.body['login-id'], req.body['login-password'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] != 'on'){
					res.status(200).send(o);
				}	else{
					DBM.generateLoginKey(o.id, req.ip, function(key){
						res.cookie('login', key, { maxAge: 900000 });
						res.status(200).send(o);
					});
				}
			}
		});
	});

	app.post('/forget', function(req, res){
		DBM.generatePasswordKey(req.body['reset-password-email'], req.body['reset-password-id'], req.ip, function(e, account){
			if (e){
				res.status(400).send(e);
			}	else{
				EM.dispatchResetPasswordLink(account, function(e, m){
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}
		});
	});

	app.post('/editpassword', function(req, res){
		let passKey = req.session.passKey;
		// destory the session after retrieving the stored passkey //
		req.session.destroy();
		DBM.updatePassword(passKey, req.body['edit-password'], function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});

	/*
		Edit user and logout page
	*/

	app.get('/my-user', function(req, res) {
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			res.render('my-user', {
				udata : req.session.user
			});
		}
	});

	app.post('/my-user', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			DBM.updateUser( req.session.user._id,{
				name	: req.body['edit-username'],
				id		: req.body['edit-ID'],
				email	: req.body['edit-email'],
				pass	: req.body['edit-password']
			}, function(e, o){
				if (e){
					res.status(400).send(e);
				}	else{
					req.session.user = o;
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/logout', function(req, res)
	{
		res.clearCookie('login');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	});

	/*
  	  Contact to admin and teacher page
	*/

	app.get('/contact', function(req, res) {
		if (req.session.user == null || req.session.user.class == "admin" || req.session.user.class == "teacher"){
			res.redirect('/');
		}	else{
			DBM.getAllTeachersNadmin(function(e, array) {
				res.render('contact', {
					udata: req.session.user,
					sendto: array
				});
			});
		}
	});


	app.post('/contact', function (req, res) {
		EM.contactUsEmailSent(req.body['contact-to'],req.body['contact-message'],req.session.user , function(e, m){
			if (!e){
				res.status(200).send('ok');
			}
		});
	})
	/*
		rest of pages
	*/

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });
};
