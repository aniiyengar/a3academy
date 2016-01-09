/**
 * TopicController
 *
 * @description :: Server-side logic for managing topics
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	vote: function(req, res, next) {

		if (!req.session.user) {
			return res.redirect("/#vote");
		}

		Topic.find().exec(function(err, topics) {
			var t1 = topics;
			t1.sort(function(a, b) {
				var lowerBound = function(p, n) {
					if (n == 0) return 0;
					var z = 1.96;
					var phat = 1.0 * p / n;
					var num = phat+z*z/(2*n)-z*Math.sqrt((phat*(1-phat)+z*z/(4*n))/n);
					var den = 1+z*z/n;

					return num / den;
				}

				return lowerBound(b.upvotes, b.upvotes + b.downvotes) - lowerBound(a.upvotes, a.upvotes + a.downvotes);
			});
			res.locals.topics = topics;
			res.locals.req = req;
			return res.view("vote.ejs");
		});
	},

	ballot: function(req, res, next) {
		var which = req.param("w");
		var topic = req.param("t");

		User.find({id : req.session.user.id}).exec(function(err, users) {
			var user = users[0];
			var userUp = user.up;
			var userDown = user.down;

			var dDown = 0;
			var dUp = 0;

			if (userUp.indexOf(topic) >= 0) {
				userUp.splice(userUp.indexOf(topic), 1);
				dUp--;
				if (which === "down") {
					userDown.push(topic);
					dDown++;
				}
			}
			else if (userDown.indexOf(topic) >= 0) {
				userDown.splice(userDown.indexOf(topic), 1);
				dDown--;
				if (which === "up") {
					userUp.push(topic);
					dUp++;
				}
			}
			else {
				if (which === "up") {
					userUp.push(topic);
					dUp++;
				}
				else {
					userDown.push(topic);
					dDown++;
				}
			}

			User.update({id: req.session.user.id}, {id : req.session.user.id, up: userUp, down: userDown}, function(err, users) {
				var user = users[0];
				req.session.user = user;

				res.locals.req = req;
				Topic.find({name: topic}).exec(function(err, topics) {
					var t = topics[0];
					var uct = t.upvotes;
					var dct = t.downvotes;
					uct += dUp;
					dct += dDown;
					Topic.update({name: topic}, {name: topic, upvotes: uct, downvotes: dct}, function(err, topic) {

						Topic.find().exec(function(err, t1) {
							res.locals.topics = t1;
							res.locals.req = req;
							return res.view("homepage.ejs");
						});
					});
				});
			});
		});
	},

	suggest: function(req, res, next) {
		require("request").post({
			url:"https://www.google.com/recaptcha/api/siteverify",
			form: {
				secret:'6Le_-QkTAAAAAGSJjDVWvtA3TkfBr8hZzmo3SkGR',
				response: req.param("g-recaptcha-response")
			}
		}, function(err, response, body) {

			if (JSON.parse(body).success) {
				console.log("Success!");
				var nodemailer = require('nodemailer');
				var transporter = nodemailer.createTransport({
				    service: 'gmail',
				    auth: {
				        user: 'avaiazacademy@gmail.com',
				        pass: 'oxymoron522'
				    }
				    
				});

				var mailOptions = {
				    from: 'avaiazacademy@gmail.com', // sender address
				    to: 'avaiazacademy@gmail.com', // list of receivers
				    subject: 'A3 Website Topic Request', // Subject line
				    html: '<b>A topic was requested!<b><br/>Name: ' + req.param("name") + "<br/>Email: " + req.param("email") + "<br/>Topic: " + req.param("topic") + "<br/>" // html body
				}; 

				transporter.sendMail(mailOptions, function(error, info){
				    if(error){
				        return console.log(error);
				    }

				});

				return res.redirect("/vote");
			}
			else return res.redirect("/vote");
		});
		
	}
	
};

