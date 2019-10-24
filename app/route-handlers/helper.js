'use strict';
const connection = require('../../config/db');
const fs = require('fs');
const http = require('http');
const https = require('https');
var jwt = require('jsonwebtoken')
const config = require('../../config/secret');

var helper = {
	
	get_image_by_id: function(image_id) {
		return new Promise((resolve, reject) => {
			
			let query = `SELECT * FROM images WHERE id = ${image_id}`;
		
			console.log("IMAGE QUERY",query);
		
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
	},
	get_post_by_id: function(post_id) {
		return new Promise((resolve, reject) => {
			
			let query = `SELECT id, image_id, user FROM posts WHERE id = ${post_id}`;
		
			console.log("POST QUERY",query);
		
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
	},
	get_user_by_id: function(user_id) {
		
		return new Promise((resolve, reject) => {	
			
			let query = `SELECT id, name, image_url FROM users WHERE id = ${user_id}`;
		
			console.log("USER QUERY",query);
		
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
	},
	get_comment_by_id: function(comment_id) {
		return new Promise((resolve, reject) => {
			let query = `SELECT * FROM comments WHERE id = ${comment_id} AND published = 1`;
		
			console.log("COMMENT QUERY",query);
		
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
	},
	notify_comment_post: function(user_id, post_id, comment_id) {
		return new Promise((resolve, reject) => {
			let first_user = null;
			let post = null;
			let comment = null;
			helper.get_user_by_id(user_id).then((result) => {
				first_user = result;
				helper.get_post_by_id(post_id).then((result) => {
					post = result;
					helper.get_comment_by_id(comment_id).then((result) => {
						comment = result;
						let message = `${first_user.name} commented on your post`;
						let json = {message: message, user: first_user, post: post, comment: comment};
						let data = JSON.stringify(json);
						data = connection.escape(data);
						let query = `INSERT INTO activity (owner_id, message, data) VALUES ('${post.user}','${message}', ${data})`;
						console.log(`insert activity query: ${query}`);
						    connection.query(query, function (error, results, fields) {
					            if (error) {
					                resolve({status: 500, error: {errorMessage: "An error occured on SQL insert", error: error}})
					            } else {
						            resolve({status: 200});
					            }
					    });
					});
				});
			});
		});
	},
	notify_like_post: function(user_id, post_id) {
		
		return new Promise((resolve, reject) => {
			let first_user = null;
			let post = null;
			let image = null;
			helper.get_user_by_id(user_id).then((result)=>{
				first_user = result;
				helper.get_post_by_id(post_id).then((result) => {
					post = result;			
					helper.get_image_by_id(post.image_id).then((result) => {
								
						image = result;
						let message = `${first_user.name} liked your post`;
						post.imageData = image;
						let json = {message: message, user: first_user, post: post};
						let data = JSON.stringify(json);
						data = connection.escape(data);
						let query = `INSERT INTO activity (owner_id, message, data) VALUES ('${post.user}','${message}', '${data}')`;
						console.log(`insert activity query: ${query}`);
						    connection.query(query, function (error, results, fields) {
					            if (error) {
					                resolve({status: 500, error: {errorMessage: "An error occured on SQL insert", error: error}})
					            } else {
						            resolve({status: 200});
					            }
					    });
				    });
				});
			});	
		});	
	},
	notify_follow_user: function(user_id, following_id) {
		return new Promise((resolve, reject) => {
			let first_user = null;
			let second_user = null;
			helper.get_user_by_id(user_id).then((result)=>{
				first_user = result;
				helper.get_user_by_id(following_id).then((result) => {
					second_user = result;			
					let message = `${first_user.name} started following you`;
					let json = {message: message, user: first_user};
					let data = JSON.stringify(json);
					data = connection.escape(data);
					let query = `INSERT INTO activity (owner_id, message, data) VALUES('${following_id}', '${message}', '${data}')`;
					console.log(`insert activity query: ${query}`);
					    connection.query(query, function (error, results, fields) {
			            if (error) {
			                resolve({status: 500, error: {errorMessage: "An error occured on SQL insert", error: error}})
			            } else {
				            resolve({status: 200});
			            }
				    });
				});
			});	
		});
	}
}
module.exports = helper
