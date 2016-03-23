var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

//JSON loading
var fs = require("fs");
console.log("\n *START* \n");
var dat1 = fs.readFileSync("data1.json");  //player1's data
var dat2 = fs.readFileSync("data2.json");  //player2's data
var player1gameData = JSON.parse(dat1);
var player2gameData = JSON.parse(dat2);

var DEFAULT_MAP = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];
    
/**
 * The following UNIT_POSITIONS grid corresponds to the unit ids from the JSON files.
 * Might need to define these as objects to store their state better
*/

var UNIT_POSITIONS = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,2,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];

var lobbyUsers = {};
var users = {};
var activeGames = {};

//TODO - Eventually these will need to be grabbed from the player's preferences (from a DB), then shuffled
var hand1 = [3,3,3,3];
var hand2 = [4,4,4,4];

var mana1 = [0,0,0,0];  //ranger, fighter, magician, scoundrel
var mana2 = [0,0,0,0];
    

// Routing
app.use(express.static(__dirname + '/public'));

app.get('/phaserTest', function (req, res) {
  res.send('phaserTest');
});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// Socket.io handlers

io.on('connection', function(socket) {
    console.log('New connection');
    
    socket.broadcast.emit('map', DEFAULT_MAP);
 
    socket.on('message', function(msg) {
        console.log('Got message from client: ' + msg);
        socket.broadcast.emit('response', msg);
    });
    
    socket.on('login', function(userId) {
        console.log(userId + ' joining lobby');
        socket.userId = userId;  
     
        if (!users[userId]) {    
            console.log('creating new user');
            users[userId] = {userId: socket.userId, games:{}};
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
                console.log('gameid - ' + gameId);
            });
        }
        
        socket.emit('login', {users: Object.keys(lobbyUsers), 
                              games: Object.keys(users[userId].games)});
        lobbyUsers[userId] = socket;
        
        socket.broadcast.emit('joinlobby', socket.userId);
    });
    
    socket.on('invite', function(opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);
        
        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', opponentId);
        
        var game = {
            id: Math.floor((Math.random() * 100) + 1),
            board: DEFAULT_MAP,
            units: UNIT_POSITIONS,
            users: {player1: socket.userId, player2: opponentId},
            currentPlayerTurn: 1,
            hands: {player1: hand1, player2: hand2},
            mana: {player1: mana1, player2: mana2},
            data: {player1: player1gameData, player2: player2gameData}  //very scary.  any way around doing this?
        };
        
        socket.gameId = game.id;
        activeGames[game.id] = game;
        
        users[game.users.player1].games[game.id] = game.id;
        users[game.users.player2].games[game.id] = game.id;
  
        console.log('starting game: ' + game.id);
        lobbyUsers[game.users.player1].emit('joingame', {game: game, player: 1});
        lobbyUsers[game.users.player2].emit('joingame', {game: game, player: 2});
        
        delete lobbyUsers[game.users.player1];
        delete lobbyUsers[game.users.player2];   
        
        socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game});
    });
    
    //handle a move from a client
    //TODO - Consider renaming this to handle unit placement only 
    //Also - this does not check serverside to make sure the placement is legal
    
    socket.on('move', function(msg) {
        
        socket.broadcast.emit('move', msg);
        activeGames[msg.id].units = msg.units;  //syncs client units with server's
        activeGames[msg.id].hands = msg.hands;  //syncs current hand state
        activeGames[msg.id].mana = msg.mana;
        
        
    });
    
    //TODO - Need to write a handler here for an actual MOVE (a unit moving from a place to another)
    
    /*
    socket.on('move', function(msg) {
        
        //msg should contain the following info:
        
        //the object that is moving
        //it's current position 
        //its intended destination
        
        //msg should be formatted as {obj: object moving, from: [x,y], to: [x,y]} 
        
    }
    
    */
});

