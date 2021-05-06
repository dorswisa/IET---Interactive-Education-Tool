
const crypto 		= require('crypto');
const MongoClient 	= require('mongodb').MongoClient;

var db, users,years, lessons;
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true, useNewUrlParser: true }, function(e, client) {
	if (e){
		console.log(e);
	}	else{
		db = client.db(process.env.DB_NAME);
		users = db.collection('Users');
		years = db.collection('Years');
		lessons = db.collection('Lessons')
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
					type: "Admin",
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
					type: "Teacher",
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
					type: "Pupil",
					class: "A1",
					parent: "3",
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
					type: "Parent"
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
		if (o && o.id != id) {
			console.log(newData.email + " is taken!");
			callback('email-taken');
		}
		else
		{
			users.findOne({id:newData.id}, function(e, o) {
				if (o && o.id != id) {
					console.log(newData.id + " is taken!");
					callback('id-taken');
				} else {
					users.findOne({id: id}, function (e, o) {
						o.name = newData.name;
						o.email = newData.email;
						o.id = newData.id;
						if (newData.pass != "") {
							saltAndHash(newData.pass, function (hash) {
								o.pass = hash;
							});
						}
						if(newData.type == "Pupil" && newData.class != undefined)
						{
							o.class = newData.class;
						}
						if(newData.type == "Pupil" && newData.parent != undefined)
						{
							o.parent = newData.parent;
						}
						if(o.type == "Pupil" && newData.type != "Pupil")
						{
							if(newData.type != undefined)
							{
								o.type = newData.type;
							}
							delete o.lessons;
							delete o.class;
							delete o.parent;
							o.lessons = [];
							users.findOneAndUpdate({id: id}, {$set: o, $unset:{class:'', parent:''}}, {returnOriginal: false}, callback(null, o));
						}
						else
						{
							if(newData.type != undefined)
							{
								o.type = newData.type;
							}
							users.findOneAndUpdate({id: id}, {$set: o}, {returnOriginal: false}, callback(null, o));
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
	users.find({$or: [{type: "Admin"}, {type: "Teacher"}]}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}

/*
	get All users to users page
*/

exports.getAllUsers = function(callback)
{
	users.find({$or: [{type: "Teacher"}, {type: "Pupil"}, {type: "Parent"}]}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}

exports.getAllMyPupils = function(id, callback)
{
	users.find({parent: id, type: "Pupil"}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}

exports.getAllParents = function(callback)
{
	users.find({type: "Parent"}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}

exports.getAllTeachers = function(callback)
{
	users.find({type: "Teacher"}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}

exports.getAllYears = function(callback)
{
	years.find().sort({name: -1}).toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}

exports.getAllLessons = function(callback)
{
	lessons.find().toArray(
		function(e, res) {
			if (e) callback(e)
			else callback(null, res);
		});
}


exports.deleteAccount = function(id, callback)			// if we want to delete one user
{
	console.log("The user has been deleted!");
	users.deleteOne({id: id}, callback);
}

exports.ConnectUser = function(id,callback)
{
	users.findOne({id:id}, function(e, o) {
		if (o) {
			console.log("Connecting to user: "+ id);
			callback(null, o);
		}
		else
		{
			console.log(id + " Not found in the data base!");
			callback(e,null);
		}
	});
};

exports.CreateNewUser = function(newData, callback)
{
	users.findOne({email:newData.email}, function(e, o) {
		if (o){
			console.log(newData.email + " is taken!");
			callback('user-taken');
		}	else{
			users.findOne({id:newData.id}, function(e, o) {
				if (o){
					console.log(newData.email + " is taken!");
					callback('user-taken');
				}	else {
					saltAndHash(newData.pass, function (hash) {
						newData.pass = hash;
						if(typeof newData.class === 'undefined' || newData.class == '')
						{
							delete newData.class;
						}
						if (typeof newData.parent === 'undefined' || newData.parent == '')
						{
							delete newData.parent;
						}
						newData.lessons = [];
						console.log(newData.name + " has been created in database!");
						users.insertOne(newData, callback);
					});
				}
			});
		}
	});
}

exports.CreateNewYear = function(newData, callback)
{
	years.findOne({name:newData.name}, function(e, o) {
		if (o){
			console.log(newData.name + " is taken!");
			callback('taken');
		}	else {
			if(newData.upgrade)
			{
				users.find({type: "Pupil"}).toArray(
					function(e, res) {
						if (e) callback(e)
						else {
							for(var i = 0; i< res.length; i++)
							{
								var newyear;
								if(res[i].class != "END")
								{
									if(res[i].class[0] == "L")
									{
										newyear = "END";
									}
									else
									{
										newyear = String.fromCharCode(res[i].class.charCodeAt(0) + 1) + res[i].class[1];
									}
									users.findOneAndUpdate({id: res[i].id}, {$set: {class: newyear}}, {returnOriginal: false});
								}
							}
						}
					});
			}
			delete newData.upgrade;
			console.log(newData.name + " has been created in database!");
			years.insertOne(newData, callback);
		}
	});
}

exports.updateYear = function(name,newData, callback)
{
	years.findOne({name:newData.name}, function(e, o) {
		if (o && o.name != name){
			console.log(newData.name + " already created!");
			callback('taken');
		}	else {
			if(newData.upgrade)
			{
				users.find({type: "Pupil"}).toArray(function(e, res) {
					if (e) callback(e)
					else {
						for(var i = 0; i< res.length; i++)
						{
							var newyear;
							if(res[i].class != "END")
							{
								if(res[i].class[0] == "L")
								{
									newyear = "END";
								}
								else
								{
									newyear = String.fromCharCode(res[i].class.charCodeAt(0) + 1) + res[i].class[1];
								}
								users.findOneAndUpdate({id: res[i].id}, {$set: {class: newyear}}, {returnOriginal: false});
							}
						}
					}
				});
			}
			delete newData.upgrade;
			console.log(name + " has been updated in database!");
			years.findOneAndUpdate({name: name}, {$set: newData}, {returnOriginal: false}, callback);
		}
	});
}

exports.CreateNewLesson = function(newData, callback)
{
	lessons.findOne({
			$and : [
				{
					year: newData.year
				},
				{
					class: newData.class
				},
				{
					day: newData.day
				},
				{
					$or: [
						{
							$and: [
								{
									start: { $lte: newData.start }
								},
								{
									end: { $gt: newData.start }
								}
							]
						},
						{
							$and: [
								{
									start: {$gte: newData.start}
								},
								{
									start: {$lt: newData.end}
								}
							]
						}
					]
				}
			]
		},
		function(e, o) {
		if (o){
			console.log("Two lessons in same time!");
			callback('times-conflict');
		}
		else {
			lessons.findOne({
					$and : [
						{
							year: newData.year
						},
						{
							teacher: newData.teacher
						},
						{
							day: newData.day
						},
						{
							$or: [
								{
									$and: [
										{
											start: { $lte: newData.start }
										},
										{
											end: { $gt: newData.start }
										}
									]
								},
								{
									$and: [
										{
											start: {$gte: newData.start}
										},
										{
											start: {$lt: newData.end}
										}
									]
								}
							]
						}
					]
				},
				function(e, o) {
					if (o){
					console.log("One Teacher in two lessons in the same time!");
					callback('times-conflict');
				}
				else {
					lessons.insertOne(newData, function(err,docsInserted){
						users.find({type: "Pupil", class: newData.class}).toArray(function(e, res) {
							for(var i = 0; i<res.length; i++)
							{
								if(res[i].lessons == undefined)
								{
									res[i].lessons = [];
								}
								res[i].lessons.push(getObjectId(docsInserted.ops[0]._id));
								users.findOneAndUpdate({id: res[i].id}, {$set: res[i]}, {returnOriginal: false});
							}
						});
						users.findOne({id:newData.teacher}, function(e, o) {
							if (o) {
								if(o.lessons == undefined)
								{
									o.lessons = [];
								}
								o.lessons.push(getObjectId(docsInserted.ops[0]._id));
								users.findOneAndUpdate({id: newData.teacher}, {$set: o}, {returnOriginal: false});
							}
						});
						callback(null);
						console.log("Lesson " + newData.name + " has been created in database!");
					});
				}
			});
		}
	});
}

exports.EditLesson = function(id,newData, callback)
{
	lessons.findOne({
			$and : [
				{
					year: newData.year
				},
				{
					class: newData.class
				},
				{
					day: newData.day
				},
				{
					$or: [
						{
							$and: [
								{
									start: { $lte: newData.start }
								},
								{
									end: { $gt: newData.start }
								}
							]
						},
						{
							$and: [
								{
									start: {$gte: newData.start}
								},
								{
									start: {$lt: newData.end}
								}
							]
						}
					]
				}
			]
		},
		function(e, o) {
			if (o && !(o._id.equals(getObjectId(id)))){
				console.log(getObjectId(id))
				console.log(o._id);
				console.log(o._id.equals(getObjectId("609284eec998d65024a9587c")))
				console.log("Two lessons in same time!");
				callback('times-conflict');
			}
			else {
				lessons.findOne({
					$and : [
						{
							year: newData.year
						},
						{
							teacher: newData.teacher
						},
						{
							day: newData.day
						},
						{
							$or: [
								{
									$and: [
										{
											start: { $lte: newData.start }
										},
										{
											end: { $gt: newData.start }
										}
									]
								},
								{
									$and: [
										{
											start: {$gte: newData.start}
										},
										{
											start: {$lt: newData.end}
										}
									]
								}
							]
						}
					]},
				function(e, o) {
					if (o && !(o._id.equals(getObjectId(id)))){
						console.log("One Teacher in two lessons in the same time!");
						callback('times-conflict');
					}
					else {
						lessons.findOneAndUpdate({_id: getObjectId(id)}, {$set: newData}, {returnOriginal: false}, callback);
						console.log("Lesson " + newData.name + " has been edited in database!");
					}
				});
			}
		});
}



exports.deleteYear = function(name, callback)			// if we want to delete one user
{
	console.log("The year has been deleted!");
	years.deleteOne({name: name}, callback);
}

/*exports.deleteAllAccounts = function(callback)					// if we want to restart the database
{
	users.deleteMany({}, callback);
};*/

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
