'use strict';
const passport = require('passport');
// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const connection = require('./db');
var configAuth = require('./auth');


// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
// used to deserialize the user
passport.deserializeUser(function (id, done) {
    connection.query("select * from users where id = " + id, function (err, rows) {
        done(err, rows[0]);
    });
});
// =========================================================================
// FACEBOOK ================================================================
// =========================================================================
passport.use(new FacebookStrategy({
    // pull in our app id and secret from our auth.js file
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL
},
        // facebook will send back the token and profile
                function (token, refreshToken, profile, done) {
                    process.nextTick(function () {
                        connection.query("SELECT * from `users` where profilid = " + profile.id + "", function (err, rows) {
                            if (err)
                                return done(err);
                            if (rows.length > 0) {
                                return done(null, rows[0]); // user found, return that user
                            } else {
                                var email = 'null';
                                if (!("email" in profile))
//                                    email = profile.email;
                                
                                var sql = "INSERT INTO users (profilid, name, email, password, remember_token) VALUES (" + profile.id + ",'" + profile.displayName + "', " + email + ",'" + token + "', '" + token + "')";
                                connection.query(sql, function (err, result) {
                                    if (err)
                                        throw err;
                                    
                                    connection.query("select * from users where profilid = " + profile.id, function (err, rows) {
                                        console.log(profile.id);
                                        console.log(rows);
                                        if (err)
                                            return done(err);
                                        
                                        return done(null, rows[0]); // user found, return that user

                                    });
                                });
                            }
                        })
                    });
                }));
        // =========================================================================
        // LOCAL SIGNUP ============================================================
        // =========================================================================

        passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
                function (req, email, password, done) {
                    // find a user whose email is the same as the forms email
                    // we are checking to see if the user trying to login already exists
                    connection.query("select * from users where email = '" + email + "'", function (err, rows) {
                        if (err)
                            return done(err);
                        if (rows.length) {
                            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                        } else {
                            var sql = "INSERT INTO users ( name, surname, email, password) VALUES \n\
                                        ('" + email + "', '" + email + "', " + email + ", '" + password + "')";
                            connection.query(sql, function (err, result) {
                                if (err)
                                    throw err;
                                connection.query("select * from users where email = " + email, function (err, rows) {
                                    if (err)
                                        return done(err);
                                    return done(null, rows[0]); // user found, return that user

                                });
                            });
                        }
                    });
                }));
        // =========================================================================
        // LOCAL LOGIN =============================================================
        // =========================================================================

        passport.use('local-login', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
                function (req, email, password, done) { // callback with email and password from our form
                    console.log(email);
//                    connection.query("SELECT * FROM `users` WHERE `email` = '" + email + "'", function (err, rows) {
//                        if (err)
//                            return done(err);
//                        if (!rows.length) {
//                            return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
//                        }
//
//                        // if the user is found but the password is wrong
//                        if (!(rows[0].password == password))
//                            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
//
//                        // all is well, return successful user
//                        return done(null, rows[0]);
//                    });
                }));
        module.exports = passport;
