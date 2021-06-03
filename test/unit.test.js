var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
const request = require('supertest');


var app = express();

before(function() {

    app.locals.pretty = true;
    app.set('port', process.env.PORT || 3005);
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

});

describe('Try to route "/" (Login page)', function() {
    it('Should response code 200', function(done) {
        request(app)
            .get('/')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res){
                    if (err) return done(err);
                    done();
            });
    });
});

describe('Try to route "/home" (Home page)', function() {
    it('Should response code 302 (Jump to Login Page)', function(done) {
        request(app)
            .get('/home')
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to route "/my-user" (My-User page)', function() {
    it('Should response code 302 (Jump to Login Page)', function(done) {
        request(app)
            .get('/my-user')
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to route "/contact" (Contact page)', function() {
    it('Should response code 302 (Jump to Login Page)', function(done) {
        request(app)
            .get('/my-user')
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to post in "/login" with correct username and correct password.', function() {
    it('Should response code 200 (The information is in the database - user will login to system)', function(done) {
        request(app)
            .post('/login')
            .set('Accept', 'application/json')
            .send({ 'login-id': '3', 'login-password': '123456' })
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to post in "/login" with correct username and wrong password.', function() {
    it('Should response code 400 (wrong information)', function(done) {
        request(app)
            .post('/login')
            .set('Accept', 'application/json')
            .send({ 'login-id': '3', 'login-password': '1234567' })
            .expect(400)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to post in "/forget" with correct email and correct id.', function() {
    it('Should response code 200 (The information is in the database)', function(done) {
        request(app)
            .post('/forget')
            .set('Accept', 'application/json')
            .send({ 'reset-password-email': 'pupil@gmail.com', 'reset-password-id': '2' })
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to post in "/forget" with correct email and wrong id.', function() {
    it('Should response code 400 (wrong information)', function(done) {
        request(app)
            .post('/forget')
            .set('Accept', 'application/json')
            .send({ 'reset-password-email': 'parent@gmail.com', 'reset-password-id': '5' })
            .expect(400)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to post in "/my-user" and change the email for the user without login to the user.', function() {
    it('Should response code 302 (because the user is not logged its redirect to login page)', function(done) {
        request(app)
            .post('/my-user')
            .set('Accept', 'application/json')
            .send({ 'edit-email': 'parent2@gmail.com' })
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});


describe('Try to route Users page)', function() {
    it('Should response code 302 (Jump to Login Page)', function(done) {
        request(app)
            .get('/users')
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to route Lessons page)', function() {
    it('Should response code 302 (Jump to Login Page)', function(done) {
        request(app)
            .get('/lessons')
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

describe('Try to route Years page)', function() {
    it('Should response code 302 (Jump to Login Page)', function(done) {
        request(app)
            .get('/years')
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res){
                if (err) return done(err);
                done();
            });
    });
});

