'use strict';

const connection = require('../../config/db');
const groupBy = require('group-by');
const {any, type} = require('ramda');
const config = require('../../config/secret');
const fs = require('fs');
const path = require('path');
const extract = require('extract-svg-path');

module.exports.retrieveUsers = (req, res) => {
    const query = `SELECT name, users.id as id, Count(p.id) as nr_posts  From users
Left Join posts as p on p.user = users.id group by users.id`;

    connection.query(query, function (error, results, fields) {
        if (error) {
            res.render('users', {title: 'Users | Color Now App', data: []});
        } else {
            res.render('users', {title: 'Users | Color Now App', data: results});
            res.end();
        }
    });
};

module.exports.retrieveUserData = (req, res) => {
    const id = req.params.id;
    const query = `SELECT name, users.id as id, Count(Distinct p.id) as nr_posts From users left Join posts as p on p.user = users.id where users.id = ` + id;

    connection.query(query, function (error, results, fields) {
        if (error || results[0] == undefined) {
            res.render('users_data', {title: 'Users | Color Now App', data: []});
        } else {
            const nameuser = results[0].name;
            const iduser = results[0].id;
            const querydata = `Select image_name as imagename , img.id as id,image_id as imgid, user From posts Left Join images as img on posts.image_id = img.id where upload_by = 2`;
            connection.query(querydata, function (error, resultsd, fields) {
                if (error) {
                    res.render('users_data', {title: 'Users | Color Now App', id: iduser, name: nameuser, data: []});
                } else {
                    res.render('users_data', {title: 'Users | Color Now App', id: iduser, name: nameuser, data: resultsd});
                    res.end();
                }
            });
        }
    });
};
function deleteImage(id) {
    const imageName = id;
    const getimage = `Select * FROM images WHERE id =` + imageName;
    connection.query(getimage, function (error, resultsg, fields) {
        if (error) {
            return false;
        } else {
            console.log(resultsg);
            const filename = resultsg[0].image_name;
            const removeImagePathsQuery = `DELETE FROM posts WHERE image_id =` + imageName + ` and upload_by = 2`;
            connection.query(removeImagePathsQuery, function (error, results, fields) {
                if (error) {
                    return false;
                } else {
                    const removeImageIDQuery = `DELETE FROM images WHERE id = ` + imageName;
                    connection.query(removeImageIDQuery, function (error, results, fields) {
                        if (error) {
                            console.log(error);
                            return false;
                        } else {
                            const deletePath = `./uploads/svg_images/${filename}`;
                            fs.unlink(deletePath, (err) => {
                                if (err)
                                    throw err;
                                return true;
                            });

                        }
                    });
                }

            });

        }
    });
}
module.exports.deleteImg = (req, res) => {
    const imageName = req.params.id;
    deleteImage(imageName);
    const backURL = req.header('Referer') || '/';
    res.redirect(backURL);
    res.end();
};
module.exports.deleteUser = (req, res) => {
    const imageName = req.params.id;
    const getimageuser = `Select * FROM posts WHERE user =` + imageName;
    connection.query(getimageuser, function (error, resultsg, fields) {
        if (resultsg != undefined && resultsg.length > 0) {
            for (let i = 0; i < resultsg.length; i++) {
                deleteImage(imageName);
                if (i === resultsg.length) {
                    const deleteuser = `Delete FROM users WHERE id =` + imageName;
                    connection.query(deleteuser, function (error, resultsd, fields) {
                        res.redirect('users');
                        res.end();
                    });
                }
            }
        } else {
            const deleteuser = `Delete FROM users WHERE id =` + imageName;
            connection.query(deleteuser, function (error, resultsd, fields) {
                res.redirect('/users');
                res.end();
            });
        }
    });
};
