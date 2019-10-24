var mysql = require('mysql');
////local connection
//var connection = mysql.createConnection({
//    host     : 'localhost',
//    user     : 'root',
//    password : '',
//    database : 'colornow_app'
//});
var connection = mysql.createConnection({
    host: '198.54.119.56',
    user: 'colornow_user',
    password: '7A;N8AsJkv0c',
    database: 'colornow_app'
});

connection.connect(function (err) {
    if (err) {
        console.log(err)
        console.error('error connecting: ' + err.stack);
        return;
    }
});

module.exports = connection;