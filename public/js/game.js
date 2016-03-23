//GLOBAL VARIABLES

//game is the instance of Phaser we create
var game;  

//The size of the playing area in tiles
var MAP_SIZE_WIDTH = 15;
var MAP_SIZE_HEIGHT = 15;

/**
 * PIXEL_SIZE is here in case we want to allow different resolutions
 * Currently the map + ui is 480 wide by 576 high  
 */
var PIXEL_SIZE = 32;  

//arrays to hold the users who are on the server and the games in progress
var usersOnline = [];
var myGames = [];

//serverGame is the object we get back from the server that holds many
//important game state values
var serverGame;

var playerNum;
var username;

//references to the JSON object for each player
var playerData, enemyData;

//an array of ints that holds this player's hand.
//the ints contained here map to unit IDs from playerData
var hand;

//this array holds the actual sprites for the cards
var cards = [];

//this array is for highlighting boxes for ally dropping
var box = [];

//the groups we will use to organize sprites
var groundLayer;
var uiLayer;
var spriteLayer;
var cardLayer;

//an array that holds coordinates for legal ally spawn zones
var spawnArea = [];

//logic values to handle dropping allies
var draggingAlly = false;
var mouseOnSpawnBox = false;
var mouseOverCard = false;

//the state of the map
var map;

//the mana for this user
var mana;
var manaPathNames = ['rangerMana', 'fighterMana', 'magicianMana', 'scoundrelMana'];
var manaCells = [];  //for the UI


//SOCKET.IO HANDLING'

// setup my socket client
var socket = io();


//random number generator helper
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//get the map info from server
socket.on('map', function (msg) {
    map = msg;
});

socket.on('login', function(msg) {
    usersOnline = msg.users;
    updateUserList();
            
    myGames = msg.games;
    updateGamesList();
});

socket.on('joinlobby', function (msg) {
    addUser(msg);
});

socket.on('leavelobby', function (msg) {
    removeUser(msg);
    
});

socket.on('gameadd', function(msg) {
            
    
});


socket.on('joingame', function(msg) {
    console.log("joined as game id: " + msg.game.id );   
    playerNum = msg.player;
    initGame(msg.game);
        
    $('#page-lobby').hide();
    $('#page-game').show();
        
});

//handles a unit move of any kind
socket.on('move', function (msg) {
    if (serverGame && msg.id === serverGame.id) {
        serverGame.units = msg.units;
        serverGame.mana = msg.mana;
        showWorldState();
    }
});


//MENU AND SETUP (WEB ELEMENT INTERACTION STUFF)

$('#login').on('click', function() {
    username = $('#username').val();
        
    if (username.length > 0) {
        $('#userLabel').text(username);
        socket.emit('login', username);
            
        $('#page-login').hide();
        $('#page-lobby').show();
        } 
      });

var updateGamesList = function() {
    document.getElementById('gamesList').innerHTML = '';
    myGames.forEach(function(game) {
    $('#gamesList').append($('<button>')
                    .text('#'+ game)
                    .on('click', function() {
                         socket.emit('resumegame',  game);
                    }));
    });
};
      
var updateUserList = function() {
    document.getElementById('userList').innerHTML = '';
    usersOnline.forEach(function(user) {
        $('#userList').append($('<button>')
                    .text(user)
                    .on('click', function() {
                          socket.emit('invite',  user);
                    }));
    });
};

var addUser = function(userId) {
    usersOnline.push(userId);
    updateUserList();
};

var removeUser = function(userId) {
          for (var i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
         }
         
         updateUserList();
      };

//HELPER METHOD TO CREATE AND RENDER GAME STATE - USED BY ALL ACTIVE GAME STATES

var showWorldState = function() {
    
    game.world.setBounds(0, 0, PIXEL_SIZE*MAP_SIZE_WIDTH, PIXEL_SIZE*MAP_SIZE_HEIGHT+(6*PIXEL_SIZE));
   
    //set up sprite groups
        groundLayer = game.add.group();
        uiLayer = game.add.group();
        groundSelectLayer = game.add.group();
        spriteLayer = game.add.group();
        map = serverGame.board;
        
        
        // Note that there is no data file for terrain types yet.  
            
        for(row=0; row<MAP_SIZE_HEIGHT; row++)
        {
            for(col=0; col<MAP_SIZE_WIDTH; col++)
            {
                var s = groundLayer.create(row*PIXEL_SIZE,col*PIXEL_SIZE,'tiles');
                var current = map[row][col];
                    
                switch (current)
                {
                    case 0:
                        s.frame = 240;
                        break;
                        
                    //add more cases here for the other tile types as a temporary fix
                    case 1:
                        s.frame = 161;
                        break;
                        
                    default:
                        s.frame = 240;
                }
                    
                s.scale.setTo(2,2);
            }
        }
        
        //Add the units to the world from the units 2d array
        
        for(row=0; row<MAP_SIZE_HEIGHT; row++)
        {
            for(col=0; col<MAP_SIZE_WIDTH; col++)
            {
                if(serverGame.units[row][col] !== 0)
                {
                    var struct = getStructureById(serverGame.units[row][col]);
                    var ally = getAllyById(serverGame.units[row][col]);
                    
                    if(struct !== null)
                    {
                        var st = spriteLayer.create(col*PIXEL_SIZE, row*PIXEL_SIZE, struct.name);
                        st.name = struct.name;
                        st.frame = struct.spritenum;
                    }
                    
                    if(ally !== null)
                    {
                        var a = spriteLayer.create(col*PIXEL_SIZE, row*PIXEL_SIZE, ally.name);
                        a.name = ally.name;
                        a.frame = ally.spritenum;
                        a.anchor.x = 0.15;
                        a.anchor.y = 0.35;
                    }
                    
                }
            }
        }
        
}

function renderCards()
{
    //Add the cards from the given hand
            
        for(i=0; i<hand.length; i++)
        {
                
            var curAlly;
            
            //search for ally with the id from hand
            //Note that there is no fail safe here if the ally is not found!!
                
            for(ii=0; ii<playerData.units.allies.length; ii++)
            {
                if(playerData.units.allies[ii].id == hand[i])
                {
                    curAlly = playerData.units.allies[ii];
                    break;
                }
            
            }
                
            cards.push(uiLayer.create(
                    i*PIXEL_SIZE, 15*PIXEL_SIZE, curAlly.name+'_card'
            ));
                    
            cards[i].originalPosition = cards[i].position.clone();
            //console.log(theSprite.originalPosition.x + ',' + theSprite.originalPosition.y )
                
            if(playerNum === serverGame.currentPlayerTurn)  //only enable dragging the cards if its the player's turn
            {
                cards[i].inputEnabled = true;
                cards[i].input.enableDrag();
                //theSprite.alpha = 1;
                //theSprite.events.onInputOver.add(cardMouseOver, this);
                //theSprite.events.onInputOut.add(cardStopMouseOver, this);
                //theSprite.events.onInputDown.add(cardClicked, this);
                cards[i].events.onDragStart.add(cardDragged, {card: this, id: hand[i]});
                cards[i].events.onDragStop.add(cardDragStop, {card: this, id: hand[i], handIndex: i});
            }
            
        }
}

function renderMana()
{
    //Show the mana display
        
        var yourManaLabel = game.add.text(game.world.width-160, game.world.height-180, 'Your mana:',
        {font: '20px Arial', fill: '#ffffff'});
        
        var r = 16, c = 8;
        
        for(i=0; i<mana.length; i++)
        {
            for(j=0; j<mana[i]; j++)
            {
                
                manaCells.push(uiLayer.create(c*PIXEL_SIZE, r*PIXEL_SIZE, manaPathNames[i]));
                c++;
                if(c == 13)
                {
                    c = 8;
                    r++;
                }
                
            }
        }
}

//PHASER.IO CLIENT SETUP AND CLIENT SIDE LOGIC

var initGame = function(serverGameState) {
    
        serverGame = serverGameState; //this is the game object from the server that has everything
        
        game = new Phaser.Game(PIXEL_SIZE*MAP_SIZE_WIDTH, PIXEL_SIZE*MAP_SIZE_HEIGHT+(PIXEL_SIZE*6), Phaser.AUTO, '');
        
        //Assign correct information based on player number
        playerNum == 1 ? (hand = serverGame.hands.player1,
                         playerData = serverGame.data.player1,
                         enemyData = serverGame.data.player2,
                         mana = serverGame.mana.player1
                         ) 
                         : 
                         (hand = serverGame.hands.player2,
                         playerData = serverGame.data.player2,
                         enemyData = serverGame.data.player1,
                         mana = serverGame.mana.player2);
                         
        
        //set up game states  
        game.state.add('boot', bootState);
        game.state.add('load', loadState);
        game.state.add('deckSelect', deckSelectState);
        game.state.add('playCard', playCardState);
        
        //TODO - Implement moving, attacking and defending with allies
        game.state.add('moveAttackDefend', moveAttackDefendState);
        
        game.state.add('wait', waitState);
        
        //TODO - Implement game over
        //game.state.add('end', endState);
        
        //load initial game state
        game.state.start('boot');

    }
