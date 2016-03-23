
var allySelected = false;
var spriteSelected = null;
var actionsLeftInSelected;
var cardOfSelected;

//TODO - Implement unit movement, attacking and defending

var moveAttackDefendState = {
    
    create: function() {
        
        //game.physics.startSystem(Phaser.Physics.ARCADE);
        
        showWorldState();
        registerEventsForAllies();
        registerEventsForTerrain();
        
        
        
    }
    
};

function registerEventsForAllies()
{
    spriteLayer.forEach(function(item) {
        
        item.inputEnabled = true;
        item.events.onInputDown.add(unitClicked, {sprite: item});
        game.physics.enable(item, Phaser.Physics.ARCADE);
        item.body.allowRotation = false;
        
    }, this);
}

function registerEventsForTerrain()
{
    groundLayer.forEach(function(item) {
        
        item.inputEnabled = true;
        item.events.onInputDown.add(groundClicked, {pos: item.position});
        
    }, this);
}

//works!
function unitClicked()
{
    
    console.log(this.sprite.name + " at " + this.sprite.position.x/PIXEL_SIZE + "," + this.sprite.position.y/PIXEL_SIZE + " was clicked");
    
    if(!allySelected)
    {
        //this all works very well.  
        allySelected = true;
        spriteSelected = this.sprite;
        var theAlly = getAllyByName(this.sprite.key);
        showTestGUI(theAlly); //for testing GUI layout
        
        if(theAlly !== null)
        {
            var allyInfo = [this.sprite.position.y/PIXEL_SIZE, this.sprite.position.x/PIXEL_SIZE, theAlly.move];
            highlightSquares(allyInfo);
        }
        
        
        //TODO:
    
        //Place relevant info into GUI area, buttons for actions,
        //actions remaining, etc
    }
    
    
    
}

function endOfMove()
{
    
}

function groundClicked()
{
    if(isLegalSpawnArea() && allySelected)
    {
        
        //for smoother, non-instant movement.  works great.  increase the param after the position object to make slower
        tweenMove = game.add.tween(spriteSelected).to({ x: this.pos.x, y: this.pos.y}, 1200, Phaser.Easing.Linear.None, true);
        //player.scale.setTo(1, 1);
        //animationRunning = true;
        //player.animations.play('walk', 20, true);
        tweenMove.onComplete.addOnce(endOfMove, this);
        //spriteSelected.x = this.pos.x;
        //spriteSelected.y = this.pos.y;
        
        //TODO - register a move with the server
    }
    
    allySelected = false;
    spriteSelected = null;
    if(cardOfSelected !== null) cardOfSelected.visible = false;
    
    for(i=0; i<box.length; i++)
    {
        box[i].destroy();
    }
            
    box = [];
}

function getAllyByName(name)
{
    for(i=0; i<playerData.units.allies.length; i++)  //we loop through playerData only since they are identical 
    {
                
        if(playerData.units.allies[i].name == name)
        {
            return playerData.units.allies[i];
            
        }
        
    }
            
    return null;
}

function showTestGUI(ally)
{
    cardOfSelected = uiLayer.create(PIXEL_SIZE, 15*PIXEL_SIZE, ally.name+'_card');
    moveImage = uiLayer.create(6*PIXEL_SIZE, 16*PIXEL_SIZE, 'move');
    moveImage.scale.setTo(0.125, 0.125);
    attackImage = uiLayer.create(9*PIXEL_SIZE, 16*PIXEL_SIZE, 'attack');
    attackImage.scale.setTo(0.125, 0.125);
    defendImage = uiLayer.create(12*PIXEL_SIZE, 16*PIXEL_SIZE, 'defend');
    defendImage.scale.setTo(0.125, 0.125);
}