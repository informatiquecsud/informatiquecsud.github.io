class Over extends Phaser.Scene{constructor(e,t,s){super("overlay"),this.parent=e,this.height=s,this.width=t}init(e){this.simulation=e}preload(){this.load.image("echelle","assets/scale.png")}create(){this.echelle=this.add.image(70,this.height-30,"echelle"),this.buttonsCam=[],this.camera=new CameraManager(this,this.simulation)}update(){this.camera.update(this.parent,this)}}