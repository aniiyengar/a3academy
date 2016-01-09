/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	login: function(req, res, next) {
		var uid = parseInt(req.param("u"));
		User.find({id: uid}).exec(function(err, users) {
			if (users.length == 0) {
				// create new user
				User.create({id: uid, up: [], down: []}, function(err, user) {
					req.session.user = user;
				});
			}
			else {
				req.session.user = users[0];
			}

			return res.redirect("/vote");
		});	
	}
};

