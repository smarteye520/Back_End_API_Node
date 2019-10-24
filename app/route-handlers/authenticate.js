'use strict';

const connection = require('../../config/db');
const config = require('../../config/secret');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

module.exports.logout = (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
    res.end();
};

module.exports.login = (req, res, err) => {
    console.log(req.body)
    if (req.body.email) {
        var query = 'SELECT * FROM users WHERE username = "' + req.body.email + '" ';
        connection.query(query, function (error, results, fields) {
            if (results.length < 1)
                res.render('/login', {auth: false, token: null, message: "Useri nuk egziston"});

            if (error || results[0] == undefined) {
                console.log(error)
                res.redirect('/login');
                res.end();
            } else {
                var passwordIsValid = bcrypt.compareSync(req.body.password, results[0].password);
                console.log(passwordIsValid)
                if (!passwordIsValid) {
                    res.redirect('/login');
                    res.end();
                } else {
                    req.login(results[0], function (err) {
                        console.log(err)
                        req.isAuthenticated(true);
                        res.redirect('/profile');
                        res.end();
                    });
                }
            }
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};

module.exports.renderLogin = (req, res) => {
    res.render("login", {title: 'Login | Color Now App'});
};


module.exports.registerApi = (req, res, err) => {
	

    var name = req.body.name;
    var email = req.body.email;
    var profile_id = req.body.profileId;
    var image_url = req.body.image_url;
    var facebook_token = req.body.facebook_token;
    var password = req.body.password;
    
	if(!name) {
	    return res.status(401).send({auth: false, message: 'Missing fields: name'});	    
	}
	if(!email) {
	    return res.status(401).send({auth: false, message: 'Missing fields: email'});	    
	}
	if(!profile_id) {
	    return res.status(401).send({auth: false, message: 'Missing fields: profile_id'});	    
	}
	if(!image_url) {
	    return res.status(401).send({auth: false, message: 'Missing fields: image_url'});	    
	}
	if(!password) {
	    return res.status(401).send({auth: false, message: 'Missing fields: password'});	    
	}
    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    var query = `SELECT name, id, surname, email, password FROM users WHERE profilid = ${profile_id}`;

    connection.query(query, function (error, results, fields) {
        if (results.length < 1) {
	        
	        var query = null;
	        
			if(!facebook_token) {
	            var query = `INSERT INTO users (name, email, password, profilid, image_url) VALUES ('${name}','${email}','${hashedPassword}','${profile_id}','${image_url}')`;
			} else {
	            var query = `INSERT INTO users (name, email, password, profilid, image_url, facebook_token) VALUES ('${name}','${email}','${hashedPassword}','${profile_id}','${image_url}','${facebook_token}')`;				
			}
            connection.query(query, function (error, results, fields) {
                if (error || results == undefined) {
	                console.log('auth error mysql', error);
                    res.status(200).send({auth: false, token: null});
                    res.end();
                }
                var token = jwt.sign({id: results.insertId}, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.status(200).send({auth: true, token: token});
            });
        } else {
            res.status(200).send({auth: false, token: null, message: "Egeziston useri"});
        }
    });

};
module.exports.fbLogin = (req, res, err) => {
	
	var profile_id = req.body.profileId;
    var facebook_token = req.body.facebook_token;

	if(!profile_id) {
	    return res.status(401).send({auth: false, message: 'Missing fields: profileId'});	    
	}
	
	var query = `SELECT name, id, surname, email, password FROM users WHERE profilid = ${profile_id}`;

    connection.query(query, function (error, results, fields) {
        if (results.length < 1)
            return res.status(401).send({auth: false, token: null, message: "Useri nuk egziston"});

        var user = JSON.parse(JSON.stringify(results))[0];
        if (error || user.length < 1) {
            return res.status(401).send({auth: false, token: null, message: error});
        } else {
            var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (!passwordIsValid)
                return res.status(401).send({auth: false, token: null, message: "Passwordi gabim"});

            var token = jwt.sign({id: user.id}, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
        }
        return res.status(200).send({auth: true, token: token, message: "U loguat me sukeses"});
    });
};