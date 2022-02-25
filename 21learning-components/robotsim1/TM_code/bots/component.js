class i2c{constructor(t){this.bot=t}write(t,e){16==t&&(0==e[0]?(0==e[1]?this.bot.Lmotor.setSpeed(0):1==e[1]?this.bot.Lmotor.setSpeed(e[2]):2==e[1]&&this.bot.Lmotor.setSpeed(-e[2]),0==e[3]?this.bot.Rmotor.setSpeed(0):1==e[3]?this.bot.Rmotor.setSpeed(e[4]):2==e[3]&&this.bot.Rmotor.setSpeed(-e[4])):2==e[0]&&(0==e[1]?this.bot.Rmotor.setSpeed(0):1==e[1]?this.bot.Rmotor.setSpeed(e[2]):2==e[1]&&this.bot.Rmotor.setSpeed(-e[2])))}}class pin{constructor(t,e,s){this.robot=t,this.read=e,this.write=s}read_digital(){return eval(this.read)}write_digital(set){eval(this.write.replace(")",String(set)+")"))}}class ultrasonicD{constructor(t,e,s,i,a=0,h=255,r=60){this.reference=e,this.scene=t,this.range=h,this.angle=a/180*Math.PI,this.delta=Math.sqrt(s**2+i**2),this.relAngle=s>=0?Math.atan(i/s):Math.PI+Math.atan(i/s),this.raycaster=t.raycasterPlugin.createRaycaster(),this.raycaster.mapGameObjects(t.walls),this.rayCone=this.raycaster.createRay({origin:{x:e.x+s,y:e.y+i},autoSlice:!0,collisionRange:10*h}).setConeDeg(r).setAngle(e.rotation+Math.PI/2+this.angle),this.rayCone.enablePhysics("matter"),this.raycaster.mapGameObjects(t.walls)}getDistance(){let t,e=[];this.raycaster.mapGameObjects(this.scene.walls),this.intersections=this.rayCone.castCone();for(let i=0;i<this.intersections.length;i++)t=Math.sqrt((this.intersections[i].x-this.rayCone.origin.x)**2+(this.intersections[i].y-this.rayCone.origin.y)**2),e.push(Math.round(t));let s=Math.min(...e);return s<10*this.range?Math.round(s/10):this.range}update(){this.rayCone.setOrigin(this.reference.x+this.delta*Math.cos(this.reference.rotation+this.relAngle),this.reference.y+this.delta*Math.sin(this.reference.rotation+this.relAngle)).setAngle(this.reference.rotation-Math.PI/2+this.angle)}}class infra{constructor(t,e,s,i,a=2){this.scene=t,this.reference=e,this.delta=Math.sqrt(s**2+i**2),this.relAngle=s>=0?Math.atan(i/s):Math.PI+Math.atan(i/s),this.ir=t.matter.add.gameObject(t.add.circle(e.x+s,e.y+i,a,16777215),t.matter.add.circle(e.x+s,e.y+i,1)).setCollidesWith(0).setDepth(2)}isMarked(){for(let t=0;t<this.scene.marks.length;t++)if(this.scene.matter.overlap(this.ir,this.scene.marks[t].body)){if("geom"==this.scene.marks[t].pic)return!0;const e=this.scene.textures.getPixel((this.ir.x-this.scene.marks[t].pos.x+this.scene.marks[t].body.width*this.scene.marks[t].scale.x/2)/this.scene.marks[t].scale.x,(this.ir.y-this.scene.marks[t].pos.y+this.scene.marks[t].body.width*this.scene.marks[t].scale.y/2)/this.scene.marks[t].scale.y,this.scene.marks[t].pic);if(null==e);else if(e.v<.2&0!=e.a)return!0}return!1}update(){this.ir.setPosition(this.reference.x+this.delta*Math.cos(this.reference.rotation+this.relAngle),this.reference.y+this.delta*Math.sin(this.reference.rotation+this.relAngle)),this.isMarked()?this.ir.fillColor=16777215:this.ir.fillColor=4210752}}class led{constructor(t,e,s,i,a=4){this.reference=e,this.on=!1,this.delta=Math.sqrt(s**2+i**2),this.relAngle=s>=0?Math.atan(i/s):Math.PI+Math.atan(i/s),this.led=t.add.circle(e.x+s,e.y+i,a,5242880).setDepth(2)}setOn(t){this.on=t,this.led.fillColor=t?16711680:5242880}getOn(){return this.on}update(){this.led.setPosition(this.reference.x+this.delta*Math.cos(this.reference.rotation+this.relAngle),this.reference.y+this.delta*Math.sin(this.reference.rotation+this.relAngle))}}class rgbLed{constructor(t,e,s,i,a=5){this.reference=e,this.delta=Math.sqrt(s**2+i**2),this.relAngle=s>=0?Math.atan(i/s):Math.PI+Math.atan(i/s),this.rgb=t.add.circle(e.x+s,e.y+i,a,16777215).setDepth(2)}setColor(t){this.rgb.fillColor=t}update(){this.rgb.setPosition(this.reference.x+this.delta*Math.cos(this.reference.rotation+this.relAngle),this.reference.y+this.delta*Math.sin(this.reference.rotation+this.relAngle))}}class motor{constructor(t,e,s,i,a,h,r,n,o,c=0){this.speed=0;let l=Math.sqrt(i**2+a**2),d=Math.sqrt(n.x**2+n.y**2),M=Math.sqrt(o.x**2+o.y**2);this.startAngle=i>=0?Math.atan(a/i)+s/180*Math.PI:Math.PI+Math.atan(a/i)+s/180*Math.PI,n.x>=0?this.rotationPoint1=s/180*Math.PI+Math.atan(n.y/n.x):this.rotationPoint1=(s/180+1)*Math.PI+Math.atan(n.y/n.x),o.x>=0?this.rotationPoint2=s/180*Math.PI+Math.atan(o.y/o.x):this.rotationPoint2=(s/180+1)*Math.PI+Math.atan(o.y/o.x);let y=(c+s)/180*Math.PI;this.wheel=t.matter.add.gameObject(t.add.rectangle(e.x+l*Math.cos(this.startAngle),e.y+l*Math.sin(this.startAngle),h,r,8421504),t.matter.add.rectangle(e.x+l*Math.cos(this.startAngle),e.y+l*Math.sin(this.startAngle),h,r)).setAngle(s+c).setFrictionAir(.5),t.matter.add.constraint(this.wheel,e,void 0,1,{pointA:{x:r/2*Math.sin(-y),y:r/2*Math.cos(-y)},pointB:{x:d*Math.cos(this.rotationPoint1),y:d*Math.sin(this.rotationPoint1)}}),t.matter.add.constraint(this.wheel,e,void 0,1,{pointA:{x:r/2*Math.sin(-y),y:r/2*Math.cos(-y)},pointB:{x:M*Math.cos(this.rotationPoint2),y:M*Math.sin(this.rotationPoint2)}}),t.matter.add.constraint(this.wheel,e,void 0,1,{pointA:{x:r/2*Math.sin(y),y:-r/2*Math.cos(y)},pointB:{x:d*Math.cos(this.rotationPoint1),y:d*Math.sin(this.rotationPoint1)}}),t.matter.add.constraint(this.wheel,e,void 0,1,{pointA:{x:r/2*Math.sin(y),y:-r/2*Math.cos(y)},pointB:{x:M*Math.cos(this.rotationPoint2),y:M*Math.sin(this.rotationPoint2)}})}setSpeed(t){this.speed=t}update(){this.wheel.setVelocity(Math.cos(this.wheel.rotation-Math.PI/2)*this.speed,Math.sin(this.wheel.rotation-Math.PI/2)*this.speed)}}