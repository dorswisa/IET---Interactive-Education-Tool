
const crypto 		= require('crypto');
const MongoClient 	= require('mongodb').MongoClient;

var db, users;
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true, useNewUrlParser: true }, function(e, client) {
	if (e){
		console.log(e);
	}	else{
		db = client.db(process.env.DB_NAME);
		users = db.collection('Users');
		// index fields 'user' & 'email' for faster new account validation //
		users.createIndex({user: 1, email: 1});
		console.log('mongo :: connected to database :: "'+process.env.DB_NAME+'"');
		users.findOne({email:"service.dnamovies@gmail.com"}, function(e, o) {					// insert admin user
			if (o == null) {
				users.insertOne({
					name: "Dor Swisa",
					email: "service.dnamovies@gmail.com",
					id: "316055144",
					pass: "JxusNiWHMl9bd97a99ff96c24797345e37480dfa58",
					class: "admin"
				});
			}
		});

		// create pupil,parent and teacher for check
		users.findOne({email:"teacher@gmail.com"}, function(e, o) {					// insert teacher user
			if (o == null) {
				users.insertOne({
					name: "Teacher",
					email: "teacher@gmail.com",
					id: "1",
					pass: "JxusNiWHMl9bd97a99ff96c24797345e37480dfa58",
					class: "teacher"
				});
			}
		});
		users.findOne({email:"pupil@gmail.com"}, function(e, o) {					// insert pupil user
			if (o == null) {
				users.insertOne({
					name: "pupil",
					email: "pupil@gmail.com",
					id: "2",
					pass: "JxusNiWHMl9bd97a99ff96c24797345e37480dfa58",
					class: "pupil"
				});
			}
		});
		users.findOne({email:"parent@gmail.com"}, function(e, o) {					// insert parent user
			if (o == null) {
				users.insertOne({
					name: "parent",
					email: "parent@gmail.com",
					id: "3",
					pass: "JxusNiWHMl9bd97a99ff96c24797345e37480dfa58",
					class: "parent"
				});
			}
		});
	}
});

const guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

/*
	login validation methods
*/

exports.autoLogin = function(id, pass, callback)
{
	users.findOne({id:id}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(id, pass, callback)
{
	users.findOne({id:id}, function(e, o) {
		if (o == null){
			console.log(id + " Not found in the data base!");
			callback('user-not-found');
		}	else{
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					console.log("Connecting to: "+ id);
					callback(null, o);
				}	else{
					console.log(id + " found but the password does not match!");
					callback('invalid-password');
				}
			});
		}
	});
}

exports.generateLoginKey = function(id, ipAddress, callback)
{
	let cookie = guid();
	users.findOneAndUpdate({id:id}, {$set:{
		ip : ipAddress,
		cookie : cookie
	}}, {returnOriginal : false}, function(e, o){ 
		callback(cookie);
	});
}

exports.validateLoginKey = function(cookie, ipAddress, callback)
{
// ensure the cookie maps to the user's last recorded ip address //
	users.findOne({cookie:cookie, ip:ipAddress}, callback);
}

exports.generatePasswordKey = function(email, id, ipAddress, callback)
{
	let passKey = guid();
	users.findOneAndUpdate({email:email, id:id}, {$set:{
		ip : ipAddress,
		passKey : passKey
	}, $unset:{cookie:''}}, {returnOriginal : false}, function(e, o){
		if (o.value != null){
			callback(null, o.value);
		}	else{
			callback(e || 'account not found');
		}
	});
}

exports.validatePasswordKey = function (passKey, ipAddress, callback) {
// ensure the passKey maps to the user's last recorded ip address //
	users.findOne({passKey:passKey, ip:ipAddress}, callback);
}

/*
	update method
*/

exports.updateUser = function(id,newData, callback)
{
	users.findOne({email:newData.email}, function(e, o) {
		if (o && o._id != id) {
			console.log(newData.email + " is taken!");
			callback('email-taken');
		}
		else
		{
			users.findOne({id:newData.id}, function(e, o) {
				if (o && o._id != id) {
					console.log(newData.id + " is taken!");
					callback('id-taken');
				} else {
					users.findOne({_id: getObjectId(id)}, function (e, o) {
						if (newData.pass != "") {
							saltAndHash(newData.pass, function (hash) {
								o.pass = hash;
								o.name = newData.name;
								o.email = newData.email;
								o.id = newData.id;
								users.findOneAndUpdate({_id: getObjectId(id)}, {$set: o}, {returnOriginal: false}, callback(null, o));
							});
						} else {
							o.name = newData.name;
							o.email = newData.email;
							o.id = newData.id;
							users.findOneAndUpdate({_id: getObjectId(id)}, {$set: o}, {returnOriginal: false}, callback(null, o));
						}
					});
				}
			});
		}
	});
}

exports.updatePassword = function(passKey, newPass, callback)
{
	saltAndHash(newPass, function(hash){
		newPass = hash;
		users.findOneAndUpdate({passKey:passKey}, {$set:{pass:newPass}, $unset:{passKey:''}}, {returnOriginal : false}, callback);
	});
}

/*
	get All teachers and admin from db method
*/

exports.getAllTeachersNadmin = function(callback)
{
	users.find({$or: [{class: "admin"}, {class: "teacher"}]}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}


/*
exports.deleteAccount = function(id, callback)			// if we want to delete one user
{
	console.log("The user has been deleted!");
	users.deleteOne({_id: getObjectId(id)}, callback);
}

exports.deleteAllAccounts = function(callback)					// if we want to restart the database
{
	users.deleteMany({}, callback);
};
*/

/*
	private encryption & validation methods
*/

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
};

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
};

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
};

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
};
