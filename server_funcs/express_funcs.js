function initSession(req, res, next) {
    if (!req.session.hasOwnProperty("username")) {
        req.session.guest = true;
        req.session.username = "guest#" + (Math.floor(Math.random() * 1000) + 1000).toString();
    }
    next();
}

function setQueryParams(req, res, next) {
    if (req.query.hasOwnProperty('limit')) {
        try {
            req.query.limit = parseInt(req.query.limit);
        } catch (err) {
            req.query.limit = 10;
        }
    } else {
        req.query.limit = 10;
    }

    if (req.query.hasOwnProperty('page')) {
        try {
            req.query.page = parseInt(req.query.page);
        } catch (err) {
            req.query.page = 1;
        }
    } else {
        req.query.page = 1;
    }

    if (!req.query.hasOwnProperty('query')) {
        req.query.query = '';
    }

    next();
}

function log(req, res, next) {
    console.log('Incoming Request: ');
    console.log('Method: ' + req.method);
    console.log('URL: ' + req.url);
    console.log('Session: ' + JSON.stringify(req.session));
    next();
}

module.exports = {initSession, setQueryParams, log};