class simulation{constructor(e,t,a,s,r,n=13421248,i=0){this.robots=[],this.game=new Phaser.Game({width:e,height:t,backgroundColor:n,type:Phaser.WEBGL,canvas:document.getElementById(a),scene:[new Simul(this,s,r,i),new Setup(e,t),new Over(this,e,t)],physics:{default:"matter",matter:{gravity:{y:0,x:0},debug:0}},plugins:{scene:[{key:"PhaserRaycaster",plugin:PhaserRaycaster,mapping:"raycasterPlugin"}]}})}}