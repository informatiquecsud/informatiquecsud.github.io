class markRect{constructor(s,t,e,i,c,a=0){this.pic="geom",this.body=s.matter.add.gameObject(s.add.rectangle(t,e,i,c,0)).setCollidesWith(0).setAngle(a),s.marks.push(this)}}class markCircle{constructor(s,t,e,i){this.pic="geom",this.body=s.matter.add.gameObject(s.add.circle(t,e,i,0)).setCollidesWith(0),console.log(s),s.marks.push(this)}}class Picture{constructor(s,t,e,i,c=0){this.pic=t,this.pos={x:e,y:i},this.scale={x:1,y:1},this.body=s.matter.add.image(e,i,t).setCollidesWith(0).setAngle(c),s.marks.push(this)}}