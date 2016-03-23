
var MAP_SIZE_WIDTH = 15;
var MAP_SIZE_HEIGHT = 15;
/**
 * PIXEL_SIZE is here in case we want to allow different resolutions
 * Currently the map + ui is 480 wide by 576 high  
 */
 
var PIXEL_SIZE = 32;  

var usersOnline = [];
var myGames = [];
var serverGame;
var playerNum;
var username;
var playerData, enemyData;
var hand;
var cards = [];
var cardSelected = [];


//SOCKET.IO HANDLING'

// setup my socket client
var socket = io();
var map;

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

//PHASER.IO CLIENT SETUP AND CLIENT SIDE LOGIC

var initGame = function(serverGameState) {
    
        serverGame = serverGameState; //this is the game object from the server that has everything
        
        var game = new Phaser.Game(PIXEL_SIZE*MAP_SIZE_WIDTH, PIXEL_SIZE*MAP_SIZE_HEIGHT+(PIXEL_SIZE*6), Phaser.AUTO, '', 
          { preload: preload, create: create, update: update, render:render });
         
        //Assign correct information based on player number
        playerNum == 1 ? (hand = serverGame.hands.player1,
                         playerData = serverGame.data.player1,
                         enemyData = serverGame.data.player2) 
                         : 
                         (hand = serverGame.hands.player2,
                         playerData = serverGame.data.player2,
                         enemyData = serverGame.data.player1);
       
        
        

        function preload () {

            //TODO: get the JSON data file from server here and use it to instantiate everything
            for(i=0; i<playerData.units.allies.length; i++)
            {
                //load spritesheets for allies
                game.load.spritesheet(
                    playerData.units.allies[i].name, 
                    playerData.units.allies[i].spritesheetPath, 
                    playerData.units.allies[i].spritewidth, 
                    playerData.units.allies[i].spriteheight
                );
                
                //load the corresponding images for the cards of those allies
                game.load.image(
                    playerData.units.allies[i].name + '_card',
                    playerData.units.allies[i].cardPath
                );
            }
            
            /*
            for(i=0; i<playerData.units.structures.length; i++)
            {
                //load spritesheets for structures
                game.load.spritesheet(
                    playerData.units.allies[i].name, 
                    playerData.units.allies[i].spritesheetPath, 
                    playerData.units.allies[i].spritewidth, 
                    playerData.units.allies[i].spriteheight
                );
            }
            */
            
            game.load.spritesheet('tiles', 'assets/set.gif', 16, 16);
            game.load.spritesheet('scenery', 'assets/basictiles.png', 16, 16);
            //game.load.spritesheet('ranger', 'assets/ranger_spritesheet.png', 80, 58);
            game.load.spritesheet('otherStuff', 'assets/extra_rpg_tiles.png', 32, 32);
            game.load.image('greenBox', 'assets/new_selection_box.png');

        }
        
        var graphics;
        var selection;
        var ranger;
        var box = [];
        var groundLayer;
        var uiLayer;
        var spriteLayer;
        var cardLayer;
        var spawnArea = [];
        
        
        function create () {

            game.world.setBounds(0, 0, PIXEL_SIZE*MAP_SIZE_WIDTH, PIXEL_SIZE*MAP_SIZE_HEIGHT+(6*PIXEL_SIZE));
            
           
           var map = serverGame.board;
           groundLayer = game.add.group();
           uiLayer = game.add.group();
           groundSelectLayer = game.add.group();
           spriteLayer = game.add.group();
           
           
           /**
             * TODO: The following code should eventually grab its data from a JSON file sent
             * from the server, so we don't have to list all of the various tile types here
             * in a switch statement
            */
           
            // TODO - add the terrain from the default map 2d Array
            
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
                        //add more cases here for the other tile types
                        case 1:
                            s.frame = 161;
                            break;
                        
                        default:
                            s.frame = 240;
                    }
                    
                    s.scale.setTo(2,2);
                    }
            }
            
            //add the portals - eventually this will be obsolete and included in the block below this one
            var portal1X = 2, portal1Y = 2;
            var portal2X = MAP_SIZE_WIDTH-3, portal2Y = MAP_SIZE_HEIGHT-3;
            var portal1 = spriteLayer.create(portal1X*PIXEL_SIZE, portal1Y*PIXEL_SIZE,'otherStuff');
            portal1.frame = 859;
            var portal2 = spriteLayer.create(portal2X*PIXEL_SIZE, portal2Y*PIXEL_SIZE,'otherStuff');
            portal2.frame = 859;
            
            
            /**
             * TODO: The following code should eventually grab its data from a JSON file sent
             * from the server, so we don't have to list all of the various unit types here
             * in a switch statement
            */
            
            //TODO - Add the spawners to the world from the units 2d array
            /*
            for(row=0; row<MAP_SIZE_HEIGHT; row++)
            {
                for(col=0; col<MAP_SIZE_WIDTH; col++)
                {
                    if(units[row][col] != 0)
                    {
                        var struct = getStructureById(units[row][col]);
                        spriteLayer.create(col*PIXEL_SIZE, row*PIXEL_SIZE, )
                    }
                }
            }
            */
            
            //Add the cards from the given hand
            
            for(i=0; i<hand.length; i++)
            {
                
                var curAlly;
                cardSelected.push(false);
                
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
                
                var theSprite = uiLayer.create(
                        i*PIXEL_SIZE, 15*PIXEL_SIZE, curAlly.name+'_card'
                    );
                    
                theSprite.originalPosition = theSprite.position.clone();
                console.log(theSprite.originalPosition.x + ',' + theSprite.originalPosition.y )
                
                if(playerNum === serverGame.currentPlayerTurn)
                {
                    theSprite.inputEnabled = true;
                    theSprite.input.enableDrag();
                    theSprite.alpha = 1;
                    theSprite.events.onInputOver.add(cardMouseOver, this);
                    theSprite.events.onInputOut.add(cardStopMouseOver, this);
                    //theSprite.events.onInputDown.add(cardClicked, this);
                    theSprite.events.onDragStart.add(cardDragged, {card: this, id: hand[i]});
                    theSprite.events.onDragStop.add(cardDragStop, {card: this, id: hand[i]});
                }
                
              
            /*
            ranger.animations.add('attack', [0,1,2,3], 10, true);
            ranger.animations.add('run', [15,16,17,18], 10, true);
            ranger.animations.play('run');
            */
            
            //  Determine selection box
            /*
            graphics = game.add.graphics(0, 0);
            
            
            */

            }
            
            
        }
        
        var draggingAlly = false;
        var mouseOnSpawnBox = false;
        var mouseOverCard = false;
        
        function update() {
            
        }
        
        function render() {
            
        }
        
      
        //CARD INPUT FUNCTIONS
        
        //---- 'pop up' if moused over - not sure if im keeping this---
        
        function cardMouseOver(card)
        {
            //card.y -= PIXEL_SIZE;
            mouseOverCard = true;
        }
        
        
        function cardStopMouseOver(card)
        {
            //card.y += PIXEL_SIZE;
            mouseOverCard = false;
        }
        
        //-----------end of pop up code-----------------
        
        function cardDragged()
        {
            
            //check id of card, get sphere its in and light up spawners with that sphere
            var ally = getAllyById(this.id);
            
            if(playerNum === serverGame.currentPlayerTurn)
            {
                if(ally !== null)
                {
                    var validSpawners = getSpawnersMatchingAlly(ally);
                    draggingAlly = true;
                    
                    for(i=0; i<validSpawners.length; i++)
                    {
                        highlightSquares(validSpawners[i]);
                    }
                }
            
            }
        }
        
        function cardDragStop(card)
        {
            // TODO - if the player can pay for the card, allow the move
            if(draggingAlly && isLegalSpawnArea())  //if we are dragging an ally and dropping it onto a legal area
            {
                var newSprite = spriteLayer.create(
                    Math.floor(game.input.activePointer.x/PIXEL_SIZE)*PIXEL_SIZE, 
                    Math.floor(game.input.activePointer.y/PIXEL_SIZE)*PIXEL_SIZE, 
                    getAllyById(this.id).name);
                
                newSprite.anchor.x = 0.18;
                newSprite.anchor.y = 0.35;
                
                card.destroy();
                spawnArea = [];
                
                // TODO - emit move to server and register a move 
            }
            
            else{
            
                card.x = card.originalPosition.x;
                card.y = card.originalPosition.y;
                
            }
            
            for(i=0; i<box.length; i++)
            {
                box[i].destroy();
            }
            
            box = [];
            
            draggingAlly = false;
            
            
            
            
            
            
            
        }
        
        function isLegalSpawnArea()
        {
            return game.input.activePointer.x > spawnArea[0] &&
                    game.input.activePointer.x < spawnArea[1] &&
                    game.input.activePointer.y > spawnArea[2] &&
                    game.input.activePointer.y < spawnArea[3];
        }
        
        function mouseOverBox(box)
        {
            console.log('Mouse is over:' + box.x + ',' + box.y);
        }
        
        /*
        function mouseLeftBox(box)
        {
            mouseOnSpawnBox = false;
        }
        */
        
        //MISC HELPER FUNCTIONS
        
        //Returns the ally at ID id
        
        function getAllyById(id)
        {
            for(i=0; i<playerData.units.allies.length; i++)
            {
                
                if(playerData.units.allies[i].id == id)
                {
                     return playerData.units.allies[i];
                }
                
                if(enemyData.units.allies[i].id == id)
                {
                     return enemyData.units.allies[i];
                }
            }
            
            return null;
        }
        
        //Returns the structure at ID id
        
        function getStructureById(id)
        {
            for(i=0; i<playerData.units.structures.length; i++)
            {
                if(playerData.units.structures[i].id == id)
                {
                     return playerData.units.structures[i];
                }
                
                if(enemyData.units.structures[i].id == id)
                {
                     return enemyData.units.structures[i];
                }
            }
            
            return null;
        }
        
        //Returns an array of locs where spawners matching the ally occur in the world
        //And it's spawn range - format:  [row, col, range]
        
        function getSpawnersMatchingAlly(ally)
        {
            var spawners = [];  
            
            for(row=0; row<serverGame.units.length; row++)
            {
                for(col=0; col<serverGame.units[0].length; col++)
                {
                    var structure = getStructureById(serverGame.units[row][col]);
                    
                    if(structure !== null && structure.sphere == ally.sphere && playerNum%2 == serverGame.units[row][col]%2)
                    {
                        var s = [row, col, structure.spawnRange];
                        spawners.push(s);
                    }
                }
            }
            
            return spawners;
        }
        
        //highlight all squares in the grid that are within the range of row, col
        function highlightSquares(info)
        {
            var minX = 100000, maxX = -1, minY = 100000, maxY = -1;
            
            var row = info[0];
            var col = info[1];
            var range = info[2];
            
            for(y=row-range; y<=row+range; y++)
            {
                for(x=col-range; x<=col+range; x++)
                {
                    var aBox = uiLayer.create(x*PIXEL_SIZE, y*PIXEL_SIZE, 'greenBox');
                    box.push(aBox);
                    if(x*PIXEL_SIZE < minX) minX = x*PIXEL_SIZE;
                    if(y*PIXEL_SIZE < minY) minY = y*PIXEL_SIZE;
                    if(x*PIXEL_SIZE > maxX) maxX = x*PIXEL_SIZE;
                    if(y*PIXEL_SIZE > maxY) maxY = y*PIXEL_SIZE;
                    
                }
            }
            maxX += PIXEL_SIZE;
            maxY += PIXEL_SIZE;
            
            spawnArea = [minX, maxX, minY, maxY];
            
            
        }

    }
