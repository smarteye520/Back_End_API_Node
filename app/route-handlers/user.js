'use strict';

const connection = require('../../config/db');
const moment = require('moment');
var jwt = require('jsonwebtoken')
const config = require('../../config/secret');
var bcrypt = require('bcryptjs');
var helper = require('./helper.js')

module.exports.retrieveUserProfile = (req, res) => {
    if (req.isAuthenticated()) {
        var query = `SELECT * FROM users where id = '` + req.user.id + `'`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error putting details into images table")
            } else {
                res.render('profile', {title: 'Login | Color Now App', data: results[0]});
                res.end();
            }
        });

    } else {
        res.redirect('/login');
        res.end();
    }
};

module.exports.updateProfile = (req, res) => {
    if (req.isAuthenticated()) {
        var query = `SELECT * FROM users where id = '` + req.user.id + `'`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error putting details into images table")
            } else {
                res.render('profile', {title: 'Login | Color Now App', data: results[0]});
                res.end();
            }
        });

    } else {
        res.redirect('/login');
        res.end();
    }
};
module.exports.changePassword = (req, res) => {
    const oldPassword = req.body.oldpassword;
    const newPassword = req.body.newpassword;
    const confirmNewPassword = req.body.confirmpassword;

    if (!newPassword || !oldPassword || !confirmNewPassword) {
        res.status(400);
        res.send({
            errorMessage: "Validation failed",
            validParams: {
                newPassword: {
                    required: 'true'
                },
                oldPassword: {
                    required: 'true'
                }
            }
        });
        return;
    }

    if (req.isAuthenticated()) {
        var hashedPassword = bcrypt.hashSync(newPassword, 8);
        var query = `SELECT * FROM users where id = ` + req.user.id;
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error putting details into images table", error)
                res.redirect('/login');
            } else {
                var query = `UPDATE users SET password = '${hashedPassword}' where id = ` + req.user.id;
                connection.query(query, function (error, results, fields) {
                    if (error) {
                        console.log("Error putting details into images table", error)
                        res.redirect('/login');
                    } else {
                        res.redirect('/profile');
                        res.end();
                    }
                });
            }
        });

    } else {
        res.redirect('/login');
        res.end();
    }
};

module.exports.retrieveUserProfileApi = (req, res) => {
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

//Published
        var query = `SELECT users.id as id, name, profile_url, image_url, count(lika.post_id) as likes, Count(followi.fullow_user_id) as Followers, Count(followe.user_id) as Following
                    FROM users
                    Left Join posts as p on p.user = users.id
                    Left Join likes as lika on p.id = lika.post_id
                    Join (Select fullow_user_id from followers ) as followi on followi.fullow_user_id = users.id
                    Join (Select user_id from followers ) as followe on followe.user_id = users.id
                    where users.id = '` + decoded.id + `'`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error geting details from users table", error);
            } else {
                res.status(200).send(results[0]);
                res.end();
            }
        });
    });
};

module.exports.getActivityFeed = (req, res) => {
    let postid = req.params.id;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        var query = `SELECT * FROM activity WHERE owner_id = ${decoded.id} ORDER BY created_at DESC LIMIT 40`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error geting details from users table", error);
            } else {
	            res.status(200).send(results);
	            res.end();
            }
        });
    });
};
module.exports.retrieveOtherUserProfileApi = (req, res) => {
    let postid = req.params.id;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        var query = `SELECT users.id as id, name, 
                    profile_url, image_url, count(lika.post_id) as likes, 
                    Count(followi.fullow_user_id) as Followers, Count(followe.user_id) as Following
                    FROM users
                    Left Join posts as p on p.user = users.id
                    Left Join likes as lika on p.id = lika.post_id
                    Join (Select fullow_user_id from followers ) as followi on followi.fullow_user_id = users.id
                    Join (Select user_id from followers ) as followe on followe.user_id = users.id
                    where users.id = '` + postid + `'`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error geting details from users table", error);
            } else {

                var query = `SELECT images.image_name as image_name, images.id as image_id, 
                    images.paths as image_paths, posts.redomanager as image_undo_redo_manager, posts.post_id as id,
                     posts.image_type as image_type , likes.lik as likes, DATE_FORMAT(posts.updated_at, "%Y-%m-%d %H:%i:%s") as edited_at FROM images 
                    Left Join posts as posts on images.id = posts.image_id
                    Left Join (select post_id, Count(likes.post_id) as lik From likes GROUP BY likes.post_id) as likes on likes.post_id = posts.id
                    where  posts.publish = 1 and  posts.user =  ` + postid;

                connection.query(query, function (error, resultsposts, fields) {
                    if (error) {
                        console.log("Error geting details from users table", error);
                    } else {
                        res.status(200).send({profile: results[0], posts: resultsposts});
                        res.end();
                    }
                });

            }
        });
    });
};
const get_user_by_id = (user_id) => new Promise((resolve, reject) => {
	
	let query = `SELECT * FROM users WHERE id = ${user_id}`;

	console.log(query);

    connection.query(query, function (error, results, fields) {
	    
        if (error) {
			console.log("[mysql error]",error);
			reject(null);
        } else {
			console.log("has results", results[0]);
			resolve(results[0]);
        }
    });
});
const followOperation = (followerUserId, followingUserId, operation) => new Promise((resolve, reject) => {
        let query;
        if (operation === 'follow') {
            const params = `${followerUserId}, ${followingUserId}, "${moment().utc().format('YYYY-MM-DD HH:mm:ss')}", "${moment().utc().format('YYYY-MM-DD HH:mm:ss')}"`;

            query = `INSERT INTO followers(user_id, fullow_user_id, created_at, updated_at) VALUES(${params})`;
        } else {
            query = `DELETE FROM followers WHERE fullow_user_id=${followingUserId} AND user_id=${followerUserId}`;
        }

        connection.query(query, function (error) {
            if (error) {
                resolve({
                    status: 500,
                    error: {
                        errorMessage: "An error occured on SQL insert",
                        error: error
                    }
                })

            } else {
	                resolve({
	                    status: 200
	                });

            }
        });

    });

module.exports.unfollowUser = (req, res) => {
    const reqBody = req.body;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        const followingUserId = reqBody.followingUserId;

        if (!followingUserId || isNaN(followingUserId)) {
            res.status(400);
            res.send({
                errorMessage: "Validation failed",
                validParams: {
                    followingUserId: {
                        type: 'int',
                        required: 'true'
                    }
                }
            });
            return;
        }
        followOperation(decoded.id, followingUserId, 'unfollow').then((result) => {
            return res.send({status: 'succes'});
        });
    });
};

module.exports.followUser = (req, res) => {
    const reqBody = req.body;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        const followingUserId = reqBody.followingUserId;

        if (!followingUserId || isNaN(followingUserId)) {
            res.status(400);
            res.send({
                errorMessage: "Validation failed",
                validParams: {
                    followingUserId: {
                        type: 'int',
                        required: 'true'
                    }
                }
            });
            return;
        } else if (followingUserId == decoded.id) {
            res.status(400);
            res.send({
                errorMessage: "Can't follow your self",
                validParams: {
                    followingUserId: {
                        type: 'int',
                        required: 'true'
                    }
                }
            });
            return;
        }
        followOperation(decoded.id, followingUserId, 'follow').then((result) => {
	        helper.notify_like_post(decoded.id, followingUserId).then((result)=> {
				return res.send({status: 'succes'});		        	            		        
	        });
        });
    });


};
module.exports.myFollowers = (req, res) => {
    const reqBody = req.body;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        const query = `Select users.name as name, users.id as id from users
                Left Join (select fullow_user_id, user_id from followers  where fullow_user_id = ` + decoded.id + `) as f on f.user_id = users.id
             where f.fullow_user_id = ` + decoded.id + ` Group By users.id`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                return res.status(500).send({status: false, message: 'Try again'});
            } else {
                return res.status(500).send({status: true, message: 'Succes', data: results});
            }
        });

    });
};
module.exports.myFollowing = (req, res) => {
    const reqBody = req.body;
    var token = req.headers['token'];
    if (!token) {
        return res.status(401).send({auth: false, message: 'No token provided.'});	    
    }
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});	        
        }
        const query = `Select users.name as name, users.id as id from users
                Left Join (select fullow_user_id, user_id from followers  where user_id = ` + decoded.id + `) as f on f.fullow_user_id = users.id
             where f.user_id = ` + decoded.id + ` Group By users.id`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                return res.status(500).send({status: false, message: 'Try again'});
            } else {
                return res.status(500).send({status: true, message: 'Succes', data: results});
            }
        });

    });
};
module.exports.updatePushToken = (req, res, err) => {

    var firebase_token = req.body.firebase_token;	
    var token = req.headers['token'];
    if (!token) {
        return res.status(401).send({auth: false, message: 'No token provided.'});	    
    }
	if(!firebase_token) {
	    return res.status(401).send({auth: false, message: 'Missing fields: firebase_token'});	    
	}
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});	        
        }
		firebase_token = connection.escape(firebase_token);        
		const query = `UPDATE users SET firebase_token = ${firebase_token} WHERE id = ${decoded.id}`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                return res.status(500).send({status: false, message: 'Error'});
            } else {
                return res.status(200).send({status: true, message: 'Succes'});
            }
        });

    });
}
module.exports.updateProfilePicture = (req, res, err) => {

    var image_url = req.body.image_url;	
    var token = req.headers['token'];
    if (!token) {
        return res.status(401).send({auth: false, message: 'No token provided.'});	    
    }
	if(!image_url) {
	    return res.status(401).send({auth: false, message: 'Missing fields: image_url'});	    
	}
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});	        
        }
		image_url = connection.escape(image_url);        
		const query = `UPDATE users SET image_url = ${image_url} WHERE id = ${decoded.id}`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                return res.status(500).send({status: false, message: 'Error'});
            } else {
                return res.status(200).send({status: true, message: 'Succes'});
            }
        });

    });
};
module.exports.updateFacebookToken = (req, res, err) => {

    var facebook_token = req.body.facebook_token;	
    var token = req.headers['token'];
    if (!token) {
        return res.status(401).send({auth: false, message: 'No token provided.'});	    
    }
	if(!facebook_token) {
	    return res.status(401).send({auth: false, message: 'Missing fields: facebook_token'});	    
	}
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});	        
        }
		facebook_token = connection.escape(facebook_token);        

		const query = `UPDATE users SET facebook_token = ${facebook_token} WHERE id = ${decoded.id}`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                return res.status(500).send({status: false, message: error});
            } else {
                return res.status(200).send({status: true, message: 'Succes'});
            }
        });

    });
};