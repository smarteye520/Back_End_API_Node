'use strict';

const connection = require('../../config/db');
const groupBy = require('group-by');
const {any, type} = require('ramda');
var jwt = require('jsonwebtoken')
const config = require('../../config/secret');
const fs = require('fs');
const path = require('path')
const extract = require('extract-svg-path')
var helper = require('./helper.js')

const likeOperation = (imageId, userId, operation) => new Promise((resolve, reject) => {
        let query;
        if (operation === 'like') {
            query = `Insert INTO likes (post_id, user_id) SELECT * FROM (SELECT ${imageId} AS post_id, ${userId} AS user_id) AS lik  
            WHERE NOT EXISTS ( SELECT post_id FROM likes WHERE post_id = ${imageId} And user_id = ${userId}) LIMIT 1;`;
        } else {
            query = `Delete from likes WHERE post_id=${imageId} AND user_id=${userId}`;
        }

        connection.query(query, function (error) {
            if (error) {
                resolve({
                    status: 500,
                    error: {
                        errorMessage: "An error occured on SQL insert",
                        error: error
                    }
                });
            } else {
                resolve({
                    status: 200
                });
            }
        });
    });

module.exports.unlikeImage = (req, res) => {
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});
    jwt.verify(token, config.secret, function (err, decoded) {
        const reqBody = req.body;
        const imageId = reqBody.imageId;
        const userId = decoded.id;
        if (!imageId || !userId || isNaN(imageId) || isNaN(userId)) {
            res.status(400);
            res.send({
                errorMessage: "Validation failed",
                validParams: {
                    imageId: {
                        type: 'int',
                        required: 'true'
                    },
                    userId: {
                        type: 'int',
                        required: 'true'
                    }
                }
            });
            return;
        }

        likeOperation(imageId, userId, 'unlike').then((result) => {
            res.status(result.status);
            const body = result.error || "";
            res.send({"like": true});
        });
    });
}

module.exports.likeImage = (req, res) => {
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});
    jwt.verify(token, config.secret, function (err, decoded) {
        const reqBody = req.body;
        const imageId = reqBody.imageId;
        const userId = decoded.id;
        if (!imageId || !userId || isNaN(imageId) || isNaN(userId)) {
            res.status(400);
            res.send({
                errorMessage: "Validation failed",
                validParams: {
                    imageId: {
                        type: 'int',
                        required: 'true'
                    },
                    userId: {
                        type: 'int',
                        required: 'true'
                    }
                }
            });
            return;
        }

        likeOperation(imageId, userId, 'like').then((result) => {
	        
			helper.notify_like_post(decoded.id, imageId).then((result) => { 
				return res.send({status: 'succes'});	
			});
			
        });
    });

};
module.exports.retrieve = (req, res) => {
    const fileURL = path.join(__dirname, '../../uploads/svg_images/' + req.params.id)
    if (fs.existsSync(fileURL)) {
        var paths = extract(path.join(__dirname, '../../uploads/svg_images/' + req.params.id))
        var strings = [];
        var string = "";
        for (let i = 0; i < paths.length; i++) {
            if (paths[i] == "z") {
                string += paths[i];
                strings.push(string);
                string = "";
                continue
            }
            string += paths[i];
        }
        res.send(JSON.stringify(strings));
    } else {
        res.send('{"status":' + 404 + ', "paths":' + null + '}');
    }
};

module.exports.retrieveAllCategories = (req, res) => {
    
    var query = `SELECT id, name FROM categories`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                return false;
            } else {
                res.status(200).send(results);
                res.end();
            }
        })
};

module.exports.retrieveAll = (req, res) => {
    var token = req.headers['token'];
    var query = '';
    if (!token) {
        query = `SELECT images.image_name as image_name, images.id as image_id, 
            images.paths as image_paths
            FROM images where upload_by = 1 group by images.id`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                return false;
            } else {
                res.status(200).send(results);
                res.end();
            }
        });
    } else {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                query = `SELECT images.image_name as image_name, images.id as image_id, 
            images.paths as image_paths
            FROM images where upload_by = 1 group by images.id`;
                connection.query(query, function (error, results, fields) {
                    if (error) {
                        return false;
                    } else {
                        res.status(200).send(results);
                        res.end();
                    }
                });
            } else {
                query = `SELECT images.image_name as image_name, images.id as image_id, 
                images.paths as image_paths, posts.redomanager as image_undo_redo_manager, posts.image_type as image_type, DATE_FORMAT(posts.updated_at, "%Y-%m-%d %H:%i:%s") as edited_at  FROM images 
                Left Join (select redomanager, image_type, image_id, updated_at From posts where  posts.user = ` + decoded.id + ` And posts.image_type = 1) as posts on images.id = posts.image_id
                where upload_by = 1`;

                connection.query(query, function (error, results, fields) {
                    if (error) {
                        console.log(error)
                    } else {
                        res.send(results);
                        res.end();
                    }
                });
            }
        });
    }
};

module.exports.retrieveColors = (req, res) => {
    var query = `SELECT main_colors.id as id, main_colors.name as name, main_colors.hexa as firstcolor, main_colors.free as flag,  
                GROUP_CONCAT(CONCAT('{color:"', cl.hexa, '", id:"', cl.id,'"}')) as child FROM main_colors
                left JOIN colors as cl on main_colors.id = cl.parent_color GROUP by id`;
    connection.query(query, function (error, results, fields) {
        if (error) {
            console.log("Error putting details into colors table")
        } else {
            res.send(groupBy(results, 'id'));
            res.end();
            console.log('File uploaded successfully');
        }
    });
};

module.exports.explore = (req, res) => {
    const cats = req.query.categories;
    var stringQuery = '';
    if (cats != undefined) {
        if (cats.includes(",")) {
            stringQuery = 'And (';
            const catsArr = cats.split(",");
            for (let i = 0; i < catsArr.length; i++) {
                if (i == catsArr.length - 1) {
                    stringQuery = stringQuery + ' images.cats Like "%' + catsArr[i] + '%" ';
                } else {
                    stringQuery = stringQuery + ' images.cats Like "%' + catsArr[i] + '%" Or';
                }
            }
            stringQuery = stringQuery + ')';
        } else if (cats != '' || cats != null || cats != undefined) {
            stringQuery = 'And images.cats Like "%' + cats + '%"';
        }
    }

    var querya = `SELECT (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes, 
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments, 
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${decoded.id}) as liked_by_me,
    images.image_name as image_name, images.id as image_id, images.paths as image_paths, posts.id as id, posts.post_id as post_id, posts.image_type as image_type , images.cats as categories 
    FROM posts, images
    WHERE posts.image_id = images.id AND posts.publish = 1 ${stringQuery}`;

            
    console.log(querya);
    
            
    connection.query(querya, function (error, results, fields) {
        if (error) {
            console.log(error)
            res.end();
            return false;
        } else {
            res.status(200).send(results);
            res.end();
        }
    });
};

module.exports.getPostsILike = (req, res) => {


    const reqBody = req.body;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

           var querya = `SELECT (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes, 
           (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${decoded.id}) as liked_by_me, 
           images.image_name as image_name, images.id as image_id, images.paths as image_paths, posts.post_id as id, posts.post_id as post_id, posts.image_type as image_type , images.cats as categories 
           FROM posts, images
           WHERE posts.image_id = images.id AND posts.publish = 1 AND posts.id IN (SELECT post_id FROM likes WHERE user_id = ${decoded.id}) GROUP BY posts.id`;

            console.log(querya);
            
	    connection.query(querya, function (error, results, fields) {
	        if (error) {
	            res.end();
	            return false;
	        } else {
	            res.status(200).send(results);
	            res.end();
	        }
	    });
    });
};

module.exports.exploreMostLiked = (req, res) => {

    var querya = `SELECT 
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes, 
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments,
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ${decoded.id}) as liked_by_me, 
    images.image_name as image_name, images.id as image_id, images.paths as image_paths, posts.post_id as id, posts.post_id as post_id, posts.image_type as image_type , images.cats as categories 
    FROM posts, images
    WHERE posts.image_id = images.id AND posts.publish = 1 ORDER BY likes DESC`;
            
    console.log(querya);
            
    connection.query(querya, function (error, results, fields) {
        if (error) {
            res.end();
            return false;
        } else {
            res.status(200).send(results);
            res.end();
        }
    });
};



module.exports.exploreFollowers = (req, res) => {
    const reqBody = req.body;
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        const query = `Select users.id as id from users
                Left Join (select fullow_user_id, user_id from followers  where user_id = ` + decoded.id + `) as f on f.fullow_user_id = users.id
             where f.user_id = ` + decoded.id + ` Group By users.id`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                return res.status(500).send({status: false, message: 'Try again'});
            } else {
                let arrayfollowers = results.map((a) => a.id);
//                if not have followers
                if (results.length < 1) {
                    let arrayfollowersstring = arrayfollowers.join() + ', ' + decoded.id;
                    var querya = `SELECT images.image_name as image_name, images.id as image_id, 
                        images.paths as image_paths, posts.post_id as id,
                         posts.image_type as image_type , likes.lik as likes FROM images 
                        Left Join posts as posts on images.id = posts.image_id
                        Left Join (select post_id, Count(likes.post_id) as lik From likes GROUP BY likes.post_id) as likes on likes.post_id = posts.id
                        where posts.publish = 1 And posts.user in (${arrayfollowersstring}) Order by likes.lik  Desc`;
                    connection.query(querya, function (error, results, fields) {
                        if (error) {
                            res.end();
                            return false;
                        } else {
                            res.status(200).send(results);
                            res.end();
                        }
                    });
                } else {
                    let arrayfollowersstring = arrayfollowers.join() + ', ' + decoded.id;
                    var querya = `SELECT images.image_name as image_name, images.id as image_id, 
                        images.paths as image_paths, posts.post_id as id,
                         posts.image_type as image_type , likes.lik as likes FROM images 
                        Left Join posts as posts on images.id = posts.image_id
                        Left Join (select post_id, Count(likes.post_id) as lik From likes GROUP BY likes.post_id) as likes on likes.post_id = posts.id
                        where posts.publish = 1 And posts.user in (${arrayfollowersstring}) Order by likes.lik  Desc`;
                    connection.query(querya, function (error, results, fields) {
                        if (error) {
                            res.end();
                            return false;
                        } else {
                            res.status(200).send(results);
                            res.end();
                        }
                    });
                }
            }
        });

    });
};

