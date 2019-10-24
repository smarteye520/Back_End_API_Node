'use strict';

const connection = require('../../config/db');

module.exports.index = (req, res) => {
    if (req.isAuthenticated()) {
        var query = 'SELECT id, image_name, paths FROM images where upload_by = 1';
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }
            var images = [];
            results.forEach(function (element) {
                images.push({name: element["image_name"], id: element["id"], paths: element["paths"]});
            });

            res.render('index', {title: 'Home | Color Now App', images: images, items: images.length});
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};
module.exports.categories = (req, res) => {
    if (req.isAuthenticated()) {
        var query = 'SELECT id, name FROM categories';
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }

            res.render('catgeory', {title: 'Home | Color Now App', data: results});
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};
module.exports.getCategories = (req, res) => {
    var query = 'SELECT id, name, type FROM categories';
    connection.query(query, function (error, results, fields) {
        if (error) {
            console.log("Error getting data")
        }
        
        res.status(200).send({data: results, other: [
	        {name: 'Compose', id: -4 }, 
	        {name: 'Picture', id: -3 },
	        {name: 'Drawing', id: -2 }
	        ]});
        res.end();
    });
};
module.exports.addCategories = (req, res) => {
    if (req.isAuthenticated()) {
        const name = req.body.name;
        var query = `INSERT INTO categories (name) VALUES ('${name}')`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }
            res.redirect('/categories');
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};
module.exports.deleteCategories = (req, res) => {
    if (req.isAuthenticated()) {
        const id = req.params.id;
        var query = "DELETE FROM `categories` WHERE `categories`.`id` = " + id;
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }
            res.redirect('/categories');
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};

module.exports.payments = (req, res) => {
    if (req.isAuthenticated()) {
        const id = req.params.id;
        var query = 'SELECT name FROM payments';
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }
            res.redirect('/categories');
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};

module.exports.addPayments = (req, res) => {
    if (req.isAuthenticated()) {
        const name = req.body.name;
        var query = `INSERT INTO payments (name) VALUES ('${name}')`;
        connection.query(query, function (error, results, fields) {
            if (error) {
                console.log("Error getting data")
            }
            res.redirect('/categories');
        });
    } else {
        res.redirect('/login');
        res.end();
    }
};