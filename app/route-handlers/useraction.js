'use strict';
const connection = require('../../config/db');
const fs = require('fs');
const http = require('http');
const https = require('https');
var jwt = require('jsonwebtoken');
const config = require('../../config/secret');
var helper = require('./helper.js')

module.exports.render = (req, res) => {
    if (req.isAuthenticated()) {
        res.render('upload', {title: 'Login | Color Now App'})
    } else {
        res.redirect('/login');
        res.end();
    }
};
module.exports.upload = (req, res) => {
    var token = req.headers['token'];
    if (!token) {
        res.status(401).send({Auth: false})
    } else {
        jwt.verify(token, config.secret, function (err, decoded) {
            var redomanager = '';
            var postid = null;
            var imageType = 1;
            var postidsync = null;
            if (req.body.redomanager) {
                redomanager = JSON.stringify(req.body.redomanager);
            }
            if (req.body.postid)
                postid = req.body.postid;
            if (req.body.id)
                postidsync = req.body.id;

            if (req.body.type)
                imageType = req.body.type;

            const timestamp = new Date().getTime();
            if (req.files) {
                const file = req.files.image;
                const fileType = (file.name).split(".").pop();
                const fileName = `${timestamp}.${fileType}`;
                let uploadPath;
                if (fileType === 'svg') {
                    uploadPath = `./uploads/svg_images/${fileName}`;
                } else {
                    uploadPath = `./uploads/images/${fileName}`;
                }

                file.mv(uploadPath, function (err) {
                    if (err) {
                        console.log('Error uploading file !');
                        res.redirect('/', {error: "The image could not be uploaded."})
                    }
                    
                    let category;
                    
                    if(imageType == 2)
                    	category = "[-2]";
                    if(imageType == 3)
                    	category = "[-3]";
					if(imageType == 4)
                    	category = "[-4]";
                    
                    var query = ''
                    if (fileType === 'svg') {
                        query = `INSERT INTO images (image_name, upload_by, cats) VALUES ('${fileName}', 2, '[Compose]')`;
                    } else 
                    {
                        if (postid == null && imageType != 1) {
                            query = `INSERT INTO images (image_name, paths , upload_by, cats) VALUES ('${fileName}', '${fileName}', 2, '${category}')`;
                        } else {
                            query = `UPDATE posts as p
                            INNER JOIN images as img ON (p.image_id = img.id)
                            SET
                              img.image_name = '${fileName}', img.paths = '${fileName}', upload_by = 2 
                              WHERE p.image_id = ${postid} and p.user = ${decoded.id}`;
                        }
                    }
                    connection.query(query, function (error, results, fields) {
                        if (error) {
                            console.log("Error putting details into images table", error);
                            res.redirect(200, '/');
                        } else {
                            if (fileType === 'svg') {
                                // Store image paths
                                insertPost(timestamp, results.insertId, redomanager, imageType, postid, decoded.id, postidsync);
                                storeImagePaths(timestamp, results.insertId, results.insertId);
                                res.status(200).send({status: 200, message: 'uploaded'});
                            } else {
                                if (imageType == 1)
                                    imageType = 2

                                insertPost(timestamp, results.insertId, redomanager, imageType, postid, decoded.id, postidsync);
                                res.status(200).send({status: 200, message: 'uploaded'});
                            }
                        }
                    });
                });
            } else {
                insertPost(timestamp, postid, redomanager, imageType, postid, decoded.id);
                res.status(200).send({status: 200, message: 'uploaded'});
            }
        });
    }
};

const storeImagePaths = (timestamp, fileName, id) => {
//    const url = `http://localhost:3000/extract/${timestamp}.svg`;
    const url = `https://colornowapp.com:3000/extract/${timestamp}.svg`;
    https.get(url, (resp) => {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            const stringArray = JSON.parse(data);
            var values = []
            for (let i = 0; i < stringArray.length; i++) {
                values.push(stringArray[i].replace(/[\n\r\t]/g, ' '));
                if (stringArray.length == (i + 1)) {
                    values = JSON.stringify(values);
                    const query = `UPDATE images SET paths = '${values}' WHERE images.id = ${id}`;
                    connection.query(query, function (error, results, fields) {
                        if (error) {
                            return false;
                        } else {
                            return true;
                        }
                    });
                }
            }
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
};

const insertPost = (timestamp, fileId, redomanager, imagetype, postid, userid, postidsync) => {
    if (postidsync) {
        var selectquery = `Select * from posts WHERE image_id = ${postid} and user = ${userid} and post_id = ${postidsync}`;
    } else {
        var selectquery = `Select * from posts WHERE image_id = ${postid} and user = ${userid}`;
    }
    connection.query(selectquery, function (error, resultssel, fields) {
        if (error) {
            console.log("Error putting details into images table", error);
        } else {
            var query = ''
            if (resultssel.length < 1) {
                if (postidsync) {
                    query = `INSERT INTO posts (image_id, redomanager ,updated_at, image_type, user, post_id)
                     VALUES ('${fileId}', '${redomanager}', NOW(), '${imagetype}', '${userid}', ${postidsync})`;
                } else {
                    query = `INSERT INTO posts (image_id, redomanager ,updated_at, image_type, user, post_id)
                     VALUES ('${fileId}', '${redomanager}', NOW(), '${imagetype}', '${userid}', NOW() )`;
                }
            } else {
                query = `UPDATE posts SET redomanager ='${redomanager}', post_id = ${postidsync}, updated_at= NOW(), post_id = NOW() WHERE image_id = ${postid} and user = ${userid}`;
            }

            connection.query(query, function (error, results, fields) {
                if (error) {
                    console.log("Error putting details into images table", error);
                } else {
                    return true;
                }
            });
        }
    });
};
module.exports.getmyimages = (req, res) => {
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});
            
        var querya = `SELECT (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes, (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${decoded.id}) as liked_by_me , (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments, images.image_name as image_name, images.id as image_id, images.paths as image_paths, posts.redomanager as image_undo_redo_manager, posts.post_id as id, posts.id as post_id, posts.publish as publish, posts.image_type as image_type, likes.*, DATE_FORMAT(posts.updated_at, "%Y-%m-%d %H:%i:%s") as edited_at FROM images, posts, likes WHERE images.id = posts.image_id AND posts.user = ${decoded.id}`

            console.log(querya);
            
        connection.query(querya, function (error, results, fields) {
            if (error) {
                return false;
            } else {
                res.status(200).send(results);
                res.end();
            }
        });
    });
};
module.exports.getMyLikePostID = (req, res) => 
{
    let postid = req.params.id;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});
        var querya = `SELECT users.name as name, users.id as id from users
            Left Join likes as l on l.user_id = users.id
            where l.post_id = ` + postid ;
        connection.query(querya, function (error, results, fields) {
            if (error) {
                console.log(error)
                return false;
            } else {
                res.status(200).send(results);
                res.end();
                return;
            }
        });
    });
};
module.exports.postCommentOnPost = (req, res) => {
	
    var token = req.headers['token'];
    if (!token) {
	    return res.status(401).send({auth: false, message: 'No token provided.'});	    
    }
    
	let action_type = req.body.action;
	let post_id = req.body.post_id;
	let comment = req.body.comment;
	
	if(!action_type) {
	    return res.status(401).send({auth: false, message: 'Missing fields action'});	    
	}
	
	let comment_id = req.body.comment_id;
	let action = req.body.action;
			
    jwt.verify(token, config.secret, function (err, decoded) {
	    
        if (err) {
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});	        
        }
		if(action_type === 'post') {
			
			if(!post_id) {
			    return res.status(401).send({auth: false, message: 'Missing fields post_id'});	    
			}
			comment = connection.escape(comment);
			var query = `INSERT INTO comments (post_id, user_id, comment) VALUES (${post_id}, ${decoded.id}, ${comment})`;		
	        connection.query(query, function (error, results, fields) {
	            if (error) {
	                console.log(error)
	                res.status(500).send({status: 200, message: 'An error ocurred during execution'});
	                res.end();
	                return false;
	            } else {
		            
		            var comment_id = results.insertId;
		            helper.notify_comment_post(decoded.id, post_id, comment_id).then((result) => {
		                res.status(200).send({status: 200, message: 'commented on post'});
		                res.end();
		                return; 
		            });
	            }
	        });	
		} else if(action_type === 'update') {
			
			if(!comment_id) {
			    return res.status(401).send({auth: false, message: 'Missing fields comment_id'});	    
			}
			
			comment = connection.escape(comment);
			
			var query = `UPDATE comments SET comment = ${comment} WHERE id = ${comment_id} AND user_id = ${decoded.id}`;
			
			
	        connection.query(query, function (error, results, fields) {
	            if (error) {
	                console.log(error)
	                res.status(500).send({status: 500, message: 'An error ocurred during execution'});
	                res.end();
	                return false;
	            } else {
	                res.status(200).send({status: 200, message: 'comment updated'});
	                res.end();
	                return;
	            }
	        });
		} else if(action_type === 'delete') {
			
			if(!comment_id) {
			    return res.status(401).send({auth: false, message: 'Missing fields comment_id'});	    
			}
			
			var query = `UPDATE comments SET published = 0 WHERE id = ${comment_id} AND user_id = ${decoded.id}`;
			
	        connection.query(query, function (error, results, fields) {
	            if (error) {
	                console.log(error)
	                res.status(500).send({status: 500, message: 'An error ocurred during execution'});
	                res.end();
	                return false;
	            } else {
	                res.status(200).send({status: 200, message: 'comment deleted'});
	                res.end();
	                return;
	            }
	        });
		} else {
            res.status(500).send({status: 500, message: `Undefined action ${action}`});
		}
    });
}
module.exports.getPostComments = (req, res) => {
    let postid = req.params.id;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});
        var querya = `SELECT l.id as id, users.name as name, users.id as user_id, l.comment as comment, l.updated_at as comment_date from users
            Left Join comments as l on l.user_id = users.id
            where l.published = 1 AND l.post_id = ` + postid ;
        connection.query(querya, function (error, results, fields) {
            if (error) {
                console.log(error)
                return false;
            } else {
                res.status(200).send(results);
                res.end();
                return;
            }
        });
    });
};

module.exports.publish = (req, res) => {
    let postid = req.params.id;
    let publish = req.body.publish;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});
        var querya = `UPDATE posts SET publish = '${publish}' WHERE posts.id = ${postid} And posts.user = ${decoded.id}` ;
        connection.query(querya, function (error, results, fields) {
            if (error || results.changedRows < 1) {
                res.status(200).send({status: false, message: "Can't changed status or is same status"});
                return false;
            } else {
                res.status(200).send({status: true, message: "Sucessful changed status"});
                res.end();
                return;
            }
        });
    });
};

