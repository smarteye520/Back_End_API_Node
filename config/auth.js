/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {

    'facebookAuth': {
        'clientID': '314511322699735', // your App ID
        'clientSecret': '8ecf18316c7ef7f073bf6d3c919ff84a', // your App Secret
        'callbackURL': 'https://colornowapp.com:3000/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields': ['id', 'email', 'name'] // For requesting permissions from Facebook API
    }
}
