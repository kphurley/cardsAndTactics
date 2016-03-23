var loadState = {
    
    preload: function() {
        
        var loadingLabel = game.add.text(80, 150, 'Loading...', 
            {font: '30px Arial', fill: '#ffffff'});
            
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
        
        for(i=0; i<playerData.units.structures.length; i++)
        {
            //load spritesheets for structures
            game.load.spritesheet(
                playerData.units.structures[i].name, 
                playerData.units.structures[i].spritesheetPath, 
                playerData.units.structures[i].spritewidth, 
                playerData.units.structures[i].spriteheight
            );
            
        }
        
        for(i=0; i<enemyData.units.allies.length; i++)
        {
            //load spritesheets for enemy allies
            game.load.spritesheet(
                enemyData.units.allies[i].name, 
                enemyData.units.allies[i].spritesheetPath, 
                enemyData.units.allies[i].spritewidth, 
                enemyData.units.allies[i].spriteheight
            );
                
            //load the corresponding images for the cards of those allies
            game.load.image(
                enemyData.units.allies[i].name + '_card',
                enemyData.units.allies[i].cardPath
            );
        }
        
        for(i=0; i<enemyData.units.structures.length; i++)
        {
            //load spritesheets for enemy structures
            game.load.spritesheet(
                enemyData.units.structures[i].name, 
                enemyData.units.structures[i].spritesheetPath, 
                enemyData.units.structures[i].spritewidth, 
                enemyData.units.structures[i].spriteheight
            );
            
        }
            
        game.load.spritesheet('tiles', 'assets/set.gif', 16, 16);
        game.load.spritesheet('scenery', 'assets/basictiles.png', 16, 16);
        //game.load.spritesheet('ranger', 'assets/ranger_spritesheet.png', 80, 58);
        //game.load.spritesheet('otherStuff', 'assets/extra_rpg_tiles.png', 32, 32);
        
        //Mana icons
        game.load.image('greenBox', 'assets/new_selection_box.png');
        game.load.image('rangerMana', 'assets/ranger_mana_icon.bmp');
        game.load.image('fighterMana', 'assets/fighter_mana_icon.bmp');
        game.load.image('magicianMana', 'assets/magician_mana_icon.bmp');
        game.load.image('scoundrelMana', 'assets/scoundrel_mana_icon.bmp');
        
        //Button icons
        game.load.spritesheet('endPhase', 'assets/endPhaseButtons.png', 96, 32);
        game.load.image('move', 'assets/move.png');
        game.load.image('attack', 'assets/shard-sword.png');
        game.load.image('defend', 'assets/shield.png');
    },
    
    create: function() {
        
        game.state.start('deckSelect');
        
    }
}