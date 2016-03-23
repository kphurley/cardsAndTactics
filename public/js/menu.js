var menuState = {
    
    create:  function() {
        var nameLabel = game.add.text(80, 80, 'Cards and Tactics',
        {font: '50px Arial', fill: '#ffffff'});
        
        var mpLabel = game.add.text(80, game.world.height-80, 'Press M for multiplayer lobby',
        {font: '25px Arial', fill: '#ffffff'});
        
        var deckLabel = game.add.text(80, game.world.height-120, 'Press D for deck selection',
        {font: '25px Arial', fill: '#ffffff'});
        
        var mkey = game.input.keyboard.addKey(Phaser.Keyboard.M);
        var dkey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        
        mkey.onDown.addOnce(this.start, this);
        dkey.onDown.addOnce(this.deck, this);
    },
    
    start: function(){
        game.state.start('play');
    },
    
    deck: function(){
        game.state.start('deckSelect');
    }
}