'use strict';

let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let fetch = require('isomorphic-fetch');
let passport = require('passport');
let Dropbox = require('dropbox').Dropbox;
let twitter = require('./modules/twitter.js');
let twitterStrategy = require('passport-twitter').Strategy;
let dbxStrategy = require('passport-dropbox-oauth2').Strategy;
let session = require('express-session');
let dropboxToken = undefined;
let globalfiles = undefined;
let sharelinks = [];
let loggedinDropbox = false;
let loggedinTwitter = false;
let userobj = [];

passport.use(new twitterStrategy({
	consumerKey: 'consumerKey',
	consumerSecret: 'consumerSecret',
	callbackURL: 'http://localhost:3000/twittercallback'
}, function(token, tokenSecret, profile, callback) {
	return callback(null, profile);
}));

passport.use(new dbxStrategy({
	apiVersion: '2',
	clientID: 'clientID',
	clientSecret: 'clientSecret',
	callbackURL: 'http://localhost:3000/dropboxcallback'
}, function(accessToken, refreshToken, profile, done) {
	dropboxToken = accessToken;
	return done(null, profile);
}));


passport.serializeUser(function(user, callback) {
	userobj = user;
	callback(null, user);
});

passport.deserializeUser(function(obj, callback) {
	callback(null, obj);
});

let app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'resources')));
app.use(session({secret: 'whatever', resave: true, saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res) {
	res.render('index', {loggedinTwitter: loggedinTwitter, user: userobj});
});

app.get('/gallery', function(req, res){
	res.render('gallery');
});

app.get('/logout', function(req, res){
	loggedinTwitter = false;
	loggedinDropbox = false;
	res.render('index', {loggedinTwitter: loggedinTwitter , user: userobj});
});

app.get('/mydropbox', function(req, res){
	res.render('mydropbox', {loggedinDropbox: loggedinDropbox});
});

app.get('/twitter/login', passport.authenticate('twitter'));

app.get('/twittercallback', passport.authenticate('twitter', {
	failureRedirect: '/'
}), function(req, res) {
	loggedinTwitter = true;
	loggedinDropbox = false;
	let mydata = {loggedinDropbox: loggedinDropbox, files: globalfiles, sharelinks: sharelinks, loggedinTwitter: loggedinTwitter, user: userobj};
	res.render('index', mydata);
});

app.get('/dropbox/login', passport.authenticate('dropbox-oauth2'));

app.get('/dropboxcallback', passport.authenticate('dropbox-oauth2', {
	failureRedirect: '/'
}), function(req, res) {
	let dbx = new Dropbox({
		fetch: fetch,
		accessToken: dropboxToken
	});
	let files = undefined;
	async function getFiles() {
		try {
			files = await dbx.filesListFolder({path: ''});
		} catch(error)
		{
			console.log(error);
		}
	}

	async function getLinks() {
		try {
			for (let x = 0; x < files.entries.length; x++) {
				let sharelink = undefined;
				sharelink = await dbx.sharingCreateSharedLink({path: '/' + files.entries[x].name, short_url: true});
				sharelinks.push(sharelink);
			}
		} catch(error){
			console.log(error);
		}
	}

	getFiles().then(function () {
		getLinks().then(function () {
			loggedinDropbox = true;
			let mydata = {loggedinDropbox: loggedinDropbox, files: files, sharelinks: sharelinks};
			globalfiles = files;
			res.render('mydropbox', mydata);
		});
	});
});

app.get('/posttweet', function(req, res){
	setTimeout(function(){
		try {
			let tweetbody = req.query.file + ': ' + req.query.tweetbody;
			twitter.postTweet(req, res, tweetbody);
			let mydata = {
				loggedinDropbox: loggedinDropbox,
				files: globalfiles,
				sharelinks: sharelinks,
				update: 'Shared file: ' + req.query.file
			};
			res.render('mydropbox', mydata);
		} catch(error){
			console.log(error);
		}
	}, 2000);
});





//starts on port 3000
app.listen(3000, function() {
	console.log('Server is running on port 3000');
});
