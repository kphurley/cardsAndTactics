//TODO - Implement deck creation 

var deckSelectState = {
    
    create:  function() {
        var nameLabel = game.add.text(40, 80, 'Cards and Tactics',
        {font: '50px Arial', fill: '#ffffff'});
        
        var mpLabel = game.add.text(80, game.world.height-80, 'Not implemented yet.',
        {font: '25px Arial', fill: '#ffffff'});
        
        var deckLabel = game.add.text(80, game.world.height-120, 'Press D to continue',
        {font: '25px Arial', fill: '#ffffff'});
        
        
        var dkey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        
        
        dkey.onDown.addOnce(this.start, this);
    },
    
    start: function(){
        
        console.log(playerNum);
        
        playerNum == 1 ? game.state.start('playCard') : game.state.start('wait');
        
        //game.state.start('playCard');
            
    }
    
}