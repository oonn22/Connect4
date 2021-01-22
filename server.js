const config = require('./config.js');
const db = require('./Mongoose/mongoose.js');
const express = require('express');
let sessions = require('express-session');
const sharedsessions = require('express-socket.io-session');
const MongoStore = require('connect-mongo')(sessions);
const ServerLogic = require('./server_logic/server_logic_func.js');
const GameLogic = require('./server_logic/game_logic_func.js');
const ExpressFuncs = require('./server_funcs/express_funcs.js')
const SocketFuncs = require('./server_funcs/socket_funcs.js');
const UsersRouter = require('./routes/users_router.js');
const SessionRouter = require('./routes/session_router.js');
const GamesRouter = require('./routes/games_router.js');

sessions = sessions(({
    secret: config.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 7200000},
    store: new MongoStore({mongooseConnection: db})
}));

const app = express();
app.locals.db = db;
app.set("view engine", "pug");
app.set("views", "./pug_views/pages")

app.use(sessions);
app.use(express.json());
app.use(ExpressFuncs.initSession);
app.use(ExpressFuncs.log);
app.use(ExpressFuncs.setQueryParams);

app.get("/", (req, res, next) => {
    res.render("homepage", ServerLogic.navButtonsStatus(true, false, false));
});

app.use(express.static("static"));

app.use("/users", UsersRouter);
app.use("/sessions", SessionRouter);
app.use("/games", GamesRouter)

const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.use(sharedsessions(sessions, {autoSave: true}));

io.on('connection', function (socket) {
    console.log('A user connected');
    console.log(socket.handshake.session);

    socket.on('joinGameRoom', (gameID) => {
        console.log('Joining Game: \nSession: ' + JSON.stringify(socket.handshake.session) + '\nGame ID: ' + gameID);
        SocketFuncs.joinGameRoom(io, socket, gameID);
    });

    socket.on('joinChat', gameID => {
        console.log('Joining Chat: \nSession: ' + JSON.stringify(socket.handshake.session) + '\nGame ID: ' + gameID)
        SocketFuncs.joinChat(io, socket, gameID);
    });

    socket.on('takeMove', (column, gameID) => {
        console.log('Taking Move: \nSession: ' + JSON.stringify(socket.handshake.session) + '\nGame ID: ' + gameID)
        SocketFuncs.takeMove(io, socket, column, gameID);
    });

    socket.on('sendHover', (column, gameID) => {
        SocketFuncs.sendHover(io, socket, column, gameID);
    });

    socket.on('forfeit', (gameID) => {
        console.log('Forfeit: \nSession: ' + JSON.stringify(socket.handshake.session) + '\nGame ID: ' + gameID)
        SocketFuncs.forfeit(io, socket, gameID);
    });

    socket.on('sendMsg', (msg, gameID) => {
        console.log('Sending Chat: ' +
            '\nSession: ' + JSON.stringify(socket.handshake.session) +
            '\nMessage: ' + msg +
            '\nGame ID: ' + gameID)
        SocketFuncs.sendMsg(io, socket, msg, gameID);
    });

    socket.on('disconnect', () => {
        console.log('disconnected user')
    });
});

server.listen(3000);
console.log("Server listening at: http://localhost:3000")



