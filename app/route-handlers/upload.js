'use strict';

const connection = require('../../config/db');
const fs = require('fs');
const http = require('http');
const https = require('https');

module.exports.render = (req, res) => {
    if (req.isAuthenticated()) {
         var query = 'SELECT id, name FROM categories';
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }

            res.render('upload', {title: 'Login | Color Now App', data: results})
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};

const storeImagePaths = (timestamp, fileName, id) => {

    const url = `https://colornowapp.com:3000/extract/${timestamp}.svg`;
//    const url = `https://localhost:3000/extract/${timestamp}.svg`;

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

module.exports.upload = (req, res) => {

    if (!req.files) {
        console.log('No files attached');
        res.redirect('/')
    }

    const categories = req.body.cats;
    const file = req.files.image;
    const fileType = (file.name).split(".").pop();
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}.${fileType}`;
// 	let imageType;
    let uploadPath;
    if (fileType === 'svg') {
        uploadPath = `./uploads/svg_images/${fileName}`;
//         imageType = 1;
    } else {
        uploadPath = `./uploads/images/${fileName}`;
//         imageType = 2;
        
    }

    file.mv(uploadPath, function (err) {
        if (err) {
            console.log('Error uploading file !');
            res.redirect('/', {error: "The image could not be uploaded."})
        }

        const query = `INSERT INTO images (image_name, upload_by, cats, image_type) VALUES ('${fileName}', 1, '[${categories}]', 1)`;

        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error putting details into images table", error);
                res.redirect(200, '/');
            } else 
            {
                if (fileType === 'svg') 
                {
                    storeImagePaths(timestamp, fileName, results.insertId);
                    
                    const image_id = results.insertId;
                                        
					categories.forEach(function(category) {

						const query_category = `INSERT INTO image_categories (image_id, category_id) VALUES (${category}, ${image_id})`;
						connection.query(query_category, function (error, results, fields) {
							console.log("Error putting details into images table", error);
						});
					});
                    
                    
                    res.redirect('./images');
                } 
                else 
                {
                    res.redirect('/', {error: "The image could not be uploaded.It's not svg!"})
                }
            }
        });
    });
};

