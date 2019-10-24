'use strict';

const connection = require('../../config/db');

module.exports.logout = (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
    res.end();
};

module.exports.facebook = (req, passport) => {
    passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    });
    return res;
};

module.exports.callbacFb = (req, passport) => {
    passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    })
    return req;
};

