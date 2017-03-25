try {
    var secret = require('../sec');
} catch(e) {
    var secret = require(process.env.HOME + '/sec');
}
module.exports = secret;
