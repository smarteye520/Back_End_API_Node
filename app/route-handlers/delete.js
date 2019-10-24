'use strict';

const connection = require('../../config/db');

const fs = require('fs');

module.exports.delete = (req, res) => {
    const imageName = req.params.id;
    const getimage = `Select * FROM images WHERE id =` + imageName;
    connection.query(getimage, function (error, resultsg, fields) {
        if (error) {
            res.redirect('/images');
            res.end();
        } else {
            console.log(resultsg);
            const filename = resultsg[0].image_name;
            const removeImagePathsQuery = `DELETE FROM posts WHERE image_id =` + imageName;
            connection.query(removeImagePathsQuery, function (error, results, fields) {
                if (error) {
                    console.log("Error deleting image_paths");
                    console.log(error);
                    res.redirect('/images');
                    res.end();
                } else {
                    const removeImageIDQuery = `DELETE FROM images WHERE id = ` + imageName;
                    connection.query(removeImageIDQuery, function (error, results, fields) {
                        if (error) {
                            console.log(error);
                            console.log("Error deleting image_id");
                            res.redirect('/images');
                            res.end();
                        } else {
                            const deletePath = `./uploads/svg_images/${filename}`;
                            fs.unlink(deletePath, (err) => {
                                if (err)
                                    throw err;

                                console.log("Succesfully deleted image");
                                res.redirect('/images');
                                res.end();
                            });

                        }
                    });
                }

            });

        }
    });

};