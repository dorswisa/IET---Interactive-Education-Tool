
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
			DBM.updateUser( req.session.user.id,{
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
		if (req.session.user == null || req.session.user.type == "admin" || req.session.user.type == "teacher"){
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

	app.get('/users', function(req, res) {
		if (req.session.user == null || req.session.user.type == "pupil" || req.session.user.type == "teacher"){
			res.redirect('/');
		}	else{
			DBM.getAllUsers(function (e, usersarray) {
				DBM.getAllParents(function (e, parentsarray) {
					DBM.getAllMyPupils(req.session.user.id, function (e, myusers) {
						res.render('users', {
							udata: req.session.user,
							users: req.session.user.type == "Admin" ? usersarray : myusers,
							parents: parentsarray
						});
					});
				});
			});
		}
	});

	app.post('/delete-user', function(req, res){
		if(req.session.user.type == "Admin")
		{
			DBM.deleteAccount(Object.keys(req.body)[0], function(e, obj){
				if (!e){
					res.status(200).send('ok');
				}	else{
					res.status(400).send('record not found');
				}
			});
		}
		else
		{
			res.status(400).send('record not found');
		}
	});

	app.post('/connect-user', function(req, res){
		if(req.session.user.type == "Admin" || req.session.user.type == "Parent" )
		{
			DBM.ConnectUser(Object.keys(req.body)[0], function(e, obj){
				if (!e){
					req.session.user = obj;
					DBM.generateLoginKey(req.session.user.id, req.ip, function(key){
						res.cookie('login', key, { maxAge: 900000 });
						res.status(200).send('ok');
					});
				}	else{
					res.status(400).send(e);
				}
			});
		}
		else
		{
			res.status(400).send('record not found');
		}
	});

	app.post('/edit-user', function(req, res){
		if (req.session.user == null && req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			DBM.updateUser( req.body.pastid,{
				name	: req.body['edit-username'],
				id		: req.body['edit-id'],
				email	: req.body['edit-email'],
				pass	: req.body['edit-password'],
				type	: req.body['edit-type'],
				class	: req.body['edit-class'],
				parent	: req.body['edit-parent']
			}, function(e, o){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/create-user', function(req, res){
		if (req.session.user == null || req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			DBM.CreateNewUser({
				name	: req.body['create-username'],
				id		: req.body['create-id'],
				email	: req.body['create-email'],
				pass	: req.body['create-password'],
				type	: req.body['create-type'],
				class	: req.body['create-class'],
				parent	: req.body['create-parent']
			}, function(e, o){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.get('/lessons', function(req, res) {
		if (req.session.user == null || req.session.user.type == "Parent"){
			res.redirect('/');
		}	else {
			DBM.getAllTeachers(function (e, teachersarray) {
				DBM.getAllYears(function (e, yearsarray) {
					DBM.getAllLessons(function (e, lessonsarray) {
						res.render('lessons', {
							udata	: req.session.user,
							lessons	: lessonsarray,
							teachers: teachersarray,
							years	: yearsarray
						});
					});
				});
			});
		}
	});

	app.get('/years', function(req, res) {
		if (req.session.user == null || req.session.user.type != "Admin"){
			res.redirect('/');
		}	else {
			DBM.getAllYears(function (e, yearsarray) {
				res.render('years', {
					udata: req.session.user,
					years: yearsarray
				});
			});
		}
	});

	app.post('/delete-year', function(req, res){
		if(req.session.user.type == "Admin")
		{
			DBM.deleteYear(Object.keys(req.body)[0], function(e, obj){
				if (!e){
					res.status(200).send('ok');
				}	else{
					res.status(400).send('record not found');
				}
			});
		}
		else
		{
			res.status(400).send('record not found');
		}
	});

	app.post('/edit-year', function(req, res){
		if (req.session.user == null || req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			DBM.updateYear( req.body.edit,{
				name	: req.body['year'],
				upgrade	: req.body['start-year'] != undefined ? true : false
			}, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/create-year', function(req, res){
		if (req.session.user == null || req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			DBM.CreateNewYear({
				name	: req.body['year'],
				upgrade	: req.body['start-year'] != undefined ? true : false
			}, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/create-lesson', function(req, res){
		if (req.session.user == null && req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			DBM.CreateNewLesson({
				year	: req.body['create-year'],
				name	: req.body['create-name'],
				teacher	: req.body['create-teacher'],
				class	: req.body['create-class'],
				day		: req.body['create-day'],
				start	: parseInt(req.body['create-start']),
				end		: parseInt(req.body['create-end'])
			}, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/edit-lesson', function(req, res){
		if (req.session.user == null && req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			console.log(req.body);
			DBM.EditLesson(req.body.pastid,{
				year	: req.body['edit-year'],
				name	: req.body['edit-name'],
				teacher	: req.body['edit-teacher'],
				class	: req.body['edit-class'],
				day		: req.body['edit-day'],
				start	: parseInt(req.body['edit-start']),
				end		: parseInt(req.body['edit-end'])
			}, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/delete-lesson', function(req, res){
		if(req.session.user.type == "Admin")
		{
			DBM.deleteLesson(Object.keys(req.body)[0], function(e, obj){
				if (!e){
					res.status(200).send('ok');
				}	else{
					res.status(400).send('record not found');
				}
			});
		}
		else
		{
			res.status(400).send('record not found');
		}
	});

	app.get('/schedule', function(req, res) {
		if (req.session.user == null || req.session.user.type == "admin" || req.session.user.type == "teacher"){
			res.redirect('/');
		}	else{
			DBM.getAllMyPupils(req.session.user.id, function (e, pupsarray) {
				DBM.getAllLessons(function (e, lsnarray) {
					DBM.getAllTeachers(function (e, teachersarray) {
						res.render('schedule', {
						udata: req.session.user,
						pupils: pupsarray,
						lessons: lsnarray,
						teachers: teachersarray
						});
					});
				});
			});
		}
	});

	app.get('/lesson', function(req, res) {
		if(req.query['id'] !== undefined) {
			DBM.getAllTeachers(function (e, teachersarray) {
				DBM.getAllLessons( function (e, dblessons) {
					DBM.getAllContents( function (e, contentsarray) {
						let lesson = dblessons.find(value => value._id.toString() == req.query['id']);
						if (lesson) {
							lesson.contents = lesson.contents != undefined ? lesson.contents.map(String) : null;
							res.render('lesson', {
								udata: req.session.user,
								lesson: lesson,
								teachers: teachersarray,
								contents: lesson.contents != undefined ? contentsarray.filter(value => lesson.contents.includes(value._id.toString())) : []
							});
						} else res.redirect('/');
					});
				});
			});
		}
		else res.redirect('/');
	});

	app.post('/create-content', function(req, res){
		if (req.session.user == null && req.session.user.type != "Admin"){
			res.redirect('/');
		}	else{
			DBM.CreateNewContent({
				description	: req.body['create-des'],
				meeting		: req.body['create-met'],
				start		: req.body['date-start'],
				end			: req.body['date-end'],
				type		: req.body['create-type'],
				questions	: req.body['questions'],
			}, req.body.lesson, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/delete-content', function(req, res){
		if(req.session.user.type == "Admin" || req.session.user.type == "Teacher")
		{
			DBM.deleteContent(Object.keys(req.body)[0], function(e, obj){
				if (!e){
					res.status(200).send('ok');
				}	else{
					res.status(400).send('record not found');
				}
			});
		}
		else
		{
			res.status(400).send('record not found');
		}
	});

	app.get('/content', function(req, res) {
		if(req.query['id'] !== undefined) {
			DBM.getAllContents( function (e, contentsarray) {
				DBM.getAllLessons( function (e, lessonstsarray) {
					DBM.getAllUsers( function (e, usersarray) {
						let content = contentsarray.find(value => value._id.toString() == req.query['id']);
						if (content) {
							res.render('content', {
								udata: req.session.user,
								content	: content,
								lessons	: lessonstsarray,
								users	: usersarray
							});
						} else res.redirect('/');
					});
				});
			});
		}
		else res.redirect('/');
	});

	app.post('/user-send-content', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			DBM.CreatePupilContent(req.body, req.session.user.id, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/add-grade', function(req, res){
		if(req.session.user == undefined || req.session.user.type == "Pupil" || req.session.user.type == "Parent"){
			res.redirect('/');
		}	else{
			DBM.AddGrade(req.body.grade, req.body.contentid, req.body.userid, function(e){
				if (e){
					res.status(400).send(e);
				}	else{
					res.status(200).send('ok');
				}
			});
		}
	});

	app.get('/grades', function(req, res) {
		if (req.session.user == null || req.session.user.type == "admin" || req.session.user.type == "teacher"){
			res.redirect('/');
		}	else{
			DBM.getAllLessons(function (e, lesarray) {
				DBM.getAllContents(function (e, conarray) {
					DBM.getAllMyPupils(req.session.user.id, function (e, puparray) {
						res.render('grades', {
							udata: req.session.user,
							contents: conarray,
							lessons: lesarray,
							pupils: puparray
						});
					});
				});
			});
		}
	});
	/*
		rest of pages
	*/

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });
};
