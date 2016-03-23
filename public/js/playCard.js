var playCardState = {

    create: function() {

        generateMana();
        console.log(mana);
        showWorldState();
        renderCards();
        renderMana();
        
        //TODO - Button to advance to next phase.  Works...but causes issues in next state.
        var button = game.add.button((MAP_SIZE_WIDTH-4)*PIXEL_SIZE, (MAP_SIZE_HEIGHT+5)*PIXEL_SIZE, 'endPhase', goToNextPhase, this, 1, 0);
        button.input.useHandCursor = true;
            
    }
};

    function goToNextPhase()
    {
        game.state.start('moveAttackDefend');
    }
      
        //CARD INPUT FUNCTIONS
        
        function cardDragged()
        {
            
            //check id of card, get sphere its in and light up spawners with that sphere
            var ally = getAllyById(this.id);
            
            if(playerNum === serverGame.currentPlayerTurn)  //should be unnecessary to check this now
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
            var moveX, moveY;
            
            var ally = getAllyById(this.id);
            var cost;
            var sphere;
            var manaIndex;
            var usableMana;
            
            //TODO - handle ability and structure cards
            
            if(ally!==null) 
            {
                cost = ally.cost;
                sphere = ally.sphere;
                
                switch(sphere)
                {
                    case 'ranger':
                        manaIndex = 0;
                        break;
                    
                    case 'fighter':
                        manaIndex = 1;
                        break;
                    
                    case 'magician':
                        manaIndex = 2;
                        break;
                        
                    case 'scoundrel':
                        manaIndex = 3;
                        break;
                    
                    default:
                        manaIndex = -1;
                        break;
                }
                
                if(manaIndex == -1) usableMana = mana[0] + mana[1] + mana[2] + mana[3]; //neutral card.  TODO - need a good way to pay for neutrals
                else usableMana = mana[manaIndex];
                    
            }
            
            //this case handles playing an ally onto a spawn zone
            
            if(draggingAlly && isLegalSpawnArea() && usableMana >= cost)  //if we are dragging an ally and dropping it onto a legal area
            {
                moveX = Math.floor(game.input.activePointer.x/PIXEL_SIZE);
                moveY = Math.floor(game.input.activePointer.y/PIXEL_SIZE);
                
                var newSprite = spriteLayer.create(
                    moveX*PIXEL_SIZE, 
                    moveY*PIXEL_SIZE, 
                    ally.name);
                
                newSprite.anchor.x = 0.15;
                newSprite.anchor.y = 0.35;
                
                //remove the card and hand reference value
                //card.destroy();
                hand.splice(this.handIndex, 1);
                
                spawnArea = [];
                
                serverGame.units[moveY][moveX] = this.id;
                mana[manaIndex] -= cost;  //TODO - need to modify this for neutral cards eventually 
                
                //destroys all mana and card sprites to prep for next world repaint
                for(i=0; i<manaCells.length; i++)  
                {
                    manaCells[i].destroy();
                }
                
                for(i=0; i<cards.length; i++)  
                {
                    cards[i].destroy();
                }
            
                manaCells = [];
                cards=[];
                
                showWorldState();
                renderCards();
                renderMana();
                
                socket.emit('move', serverGame);
                
            }
            
            //TODO - handle ability and structure cards
            
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
            for(i=0; i<playerData.units.allies.length; i++)  //we loop through playerData only since they are identical 
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
            for(i=0; i<playerData.units.structures.length; i++)  //we loop through playerData only since they are identical
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
                    aBox.alpha = 0.3;
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
        
        function generateMana()
        {
            for(row=0; row<serverGame.units.length; row++)
            {
                for(col=0; col<serverGame.units[0].length; col++)
                {
                    switch(serverGame.units[row][col])
                    {
                        case 0:
                            break;
                        
                        case 1:
                            mana[0]+=7;  //TODO - is one mana per turn enough?
                            break;
                            
                        
                        //TODO add other spawners here when built
                        default:
                            break;
                    }
                }
            }
            
        }