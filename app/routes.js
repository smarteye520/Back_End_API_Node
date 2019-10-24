'use strict';

const express = require('express'),
        passport = require('../config/passport'),
        router = express.Router();

const config = require('../config/secret');

var jwt = require('jsonwebtoken');

const action = (module, method) => require('./route-handlers/' + module)[method];

module.exports.routeMiddleware = () => {

    router.get('/', action('default', 'index'));
    router.get('/logout', action('authenticate', 'logout'));
    router.get('/login', action('authenticate', 'renderLogin'));
    router.post('/login', action('authenticate', 'login'));

    router.get('/upload', isLoggedIn, action('upload', 'render'));
    router.post('/upload', isLoggedIn, action('upload', 'upload'));
    router.get('/images', isLoggedIn, action('default', 'index'));
    router.get('/delete/:id', isLoggedIn, action('delete', 'delete'));
    router.get('/extract/:id', action('retrieve', 'retrieve'));
    router.get('/profile', isLoggedIn, action('user', 'retrieveUserProfile'));
    router.post('/change-password', isLoggedIn, action('user', 'changePassword'));
    router.get('/categories', isLoggedIn, action('default', 'categories'));
    router.get('/payments', isLoggedIn, action('default', 'payments'));
    router.get('/get-categories', action('default', 'getCategories'));
    router.post('/add-category', isLoggedIn, action('default', 'addCategories'));
    router.get('/delete-category/:id', isLoggedIn, action('default', 'deleteCategories'));
    router.get('/users', isLoggedIn, action('users-admin', 'retrieveUsers'));
    router.get('/user/:id', isLoggedIn, action('users-admin', 'retrieveUserData'));
    router.get('/delete-user/:id', isLoggedIn, action('users-admin', 'deleteUser'));
    router.get('/delete-userimg/:id', isLoggedIn, action('users-admin', 'deleteImg'));
    router.get('/users-image', isLoggedIn, action('users-admin', 'retrieveUsers'));


    router.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    }));
    router.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

    //Api calls
    router.post('/auth/register-api', action('authenticate', 'registerApi'));
    router.post('/auth/facebook-api', action('authenticate', 'fbLogin'));

	router.post('/updateProfilePicture', action('user', 'updateProfilePicture'));
	router.post('/updatePushToken', action('user', 'updatePushToken'));
	router.post('/updateFacebookToken', action('user', 'updateFacebookToken'));
	
	
    router.get('/colors', action('retrieve', 'retrieveColors'));
    router.get('/me', isLoggedInApi, action('user', 'retrieveUserProfileApi'));
    router.get('/dataotheruser/:id', isLoggedInApi, action('user', 'retrieveOtherUserProfileApi'));

    router.get('/getcategories', action('retrieve','retrieveAllCategories'));
    
    router.get('/getalldrawings', action('retrieve', 'retrieveAll'));
    router.get('/workart', isLoggedInApi, action('useraction', 'getmyimages'));
    router.get('/postlikes/:id', isLoggedInApi, action('useraction', 'getMyLikePostID'));
    router.get('/postcomments/:id', isLoggedInApi, action('useraction', 'getPostComments'));
    router.post('/upload-user', isLoggedInApi, action('useraction', 'upload'));

    router.post('/like', isLoggedInApi, action('retrieve', 'likeImage'));
    router.post('/unlike', isLoggedInApi, action('retrieve', 'unlikeImage'));
    
    router.post('/comment',isLoggedInApi, action('useraction', 'postCommentOnPost'));

    router.post('/publish/:id', isLoggedInApi, action('useraction', 'publish'));

    router.post('/follow', isLoggedInApi, action('user', 'followUser'));
    router.post('/unfollow', isLoggedInApi, action('user', 'unfollowUser'));
    router.get('/activity', isLoggedInApi, action('user', 'getActivityFeed'));
    
    router.get('/getfollowers', isLoggedInApi, action('user', 'myFollowers'));
    router.get('/getfollowing', isLoggedInApi, action('user', 'myFollowing'));
    router.post('/change-password-api', isLoggedInApi, action('user', 'changePassword'));
    router.post('/update-profile', isLoggedInApi, action('user', 'updateProfile'));

    router.get('/explore', action('retrieve', 'explore'));
    router.get('/explore-followers', action('retrieve', 'exploreFollowers'));
    router.get('/explore-likes', action('retrieve', 'exploreMostLiked'));
    router.get('/my-liked-posts', action('retrieve','getPostsILike'));
    

    return router;
};
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
function isLoggedInApi(req, res, next) {
    var token = req.headers['token'];
    if (!token)
        return res.status(401).send({auth: false, message: 'No token provided.'});

    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});

        return next();
    });
}