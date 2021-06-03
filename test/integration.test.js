var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
const request = require('supertest');


var app = express();

before(function(done) {

    app.locals.pretty = true;
    app.set('port', process.env.PORT || 3010);
    app.set('views', './app/server/views');
    app.set('view engine', 'pug');
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(require('stylus').middleware({src: './app/public'}));
    app.use(express.static('./app/public'));

// build mongo database connection url //

    process.env.DB_HOST = process.env.DB_HOST || 'localhost'
    process.env.DB_PORT = process.env.DB_PORT || 27017;
    process.env.DB_NAME = process.env.DB_NAME || 'IET';

    if (app.get('env') != 'live') {
        process.env.DB_URL = 'mongodb+srv://IETUSER:7E9ihaU9RurNZsL6@cluster0.gitpd.mongodb.net';
    } else {
// prepend url with authentication credentials //
        process.env.DB_URL = 'mongodb+srv://IETUSER:7E9ihaU9RurNZsL6@cluster0.gitpd.mongodb.net';
    }

    app.use(session({
            secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
            proxy: true,
            resave: true,
            saveUninitialized: true,
            store: new MongoStore({url: process.env.DB_URL + "/" + process.env.DB_NAME})
        })
    );

    require('../app/server/routes')(app);


    http.createServer(app).listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });

    setTimeout(function(){
        done();
    }, 1000)

});

var agent = request.agent(app);


describe('The admin connect to his user and tries to create a new parent user', function() {
    it('Should response code 200 (The information is in the database - admin will login to system)', function(done) {

        agent
            .post('/login')
            .set('Accept', 'application/json')
            .send({ 'login-id': '316055144', 'login-password': '123456' })
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });

    it('Should response code 200 (create Parent user)', function(done) {
        agent
            .post('/create-user')
            .set('Accept', 'application/json')
            .send({ 'create-username': 'test', 'create-id': 'test', 'create-email': 'test','create-password': '123456',  'create-type': 'Parent'})
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('The parent user connect to his user and tries to edit his user.', function() {
    it('Should response code 200 (The information is in the database - admin will login to system)', function(done) {
        agent
            .post('/login')
            .set('Accept', 'application/json')
            .send({ 'login-id': '3', 'login-password': '123456' })
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });

    it('Should response code 200 (change the email)', function(done) {
        agent
            .post('/my-user')
            .set('Accept', 'application/json')
            .send({ 'edit-email': 'parent@gmail.com', 'edit-password': '', 'edit-ID': '3','edit-username': 'parentt' })
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('The admin connect to his user and tries to delete a Parent user (test user).', function() {
    it('Should response code 200 (The information is in the database - admin will login to system)', function(done) {
        agent
            .post('/login')
            .set('Accept', 'application/json')
            .send({ 'login-id': '316055144', 'login-password': '123456' })
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });

    it('Should response code 200 (delete the user)', function(done) {
        agent
            .post('/delete-user')
            .set('Accept', 'application/json')
            .send({ 'test': ''})
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});