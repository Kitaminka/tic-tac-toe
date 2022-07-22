const express = require('express');
const http = require('http');
const bodyParser = require('body-parser')
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const app = express();
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

require('./modules/socketModule')(io);
require('dotenv').config();

const userRouter = require('./routes/userRouter');
const roomRouter = require('./routes/roomRouter');
const mainRouter = require('./routes/mainRouter');
const gameRouter = require('./routes/gameRouter');

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const sessionMiddleware = session({
    key: 'session',
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        mongoOptions: {
            retryWrites: true
        }
    })
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.set('view engine', 'ejs');

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/users', userRouter);
app.use('/rooms', roomRouter);
app.use('/game', gameRouter);
app.use('/', mainRouter);

app.use((req, res) => {
    return res.status(404).send('Not Found');
});

server.listen(process.env.PORT || '3000');
console.log(`Server started on port ${process.env.PORT || '3000'}`);
