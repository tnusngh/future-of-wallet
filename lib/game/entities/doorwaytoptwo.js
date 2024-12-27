ig.module(
	'game.entities.doorwaytoptwo'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityDoorwaytoptwo = ig.Entity.extend({
	size: {x: 96, y: 104},
	maxVel: {x: 0, y: 0},
	friction: {x: 0, y: 0},
	type: ig.Entity.TYPE.NONE, 
	checkAgainst: ig.Entity.TYPE.NONE, 
	collides: ig.Entity.COLLIDES.NEVER,
	health: 900000,	
	flip: false,
	gravity:0,
	gravityFactor:0,
	zIndex: 10000,
	_wmDrawBox: false,
    _wmBoxColor: 'rgba(250,0,205,0.0)',
	animSheet: new ig.AnimationSheet( 'media/tile-work/door-01-overlay.png', 96, 104 ),
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.addAnim( 'exist', 1, [0], true );
		if (!ig.global.wm){
			ig.game.sortEntitiesDeferred();
		}
		
	},
			

});

});