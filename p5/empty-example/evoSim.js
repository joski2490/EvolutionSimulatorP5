let WIDTH = 1100;
let HEIGHT = 700;

let bots = []; // List of bots
let foods = []; // List of foods
let poisons = []; // List of poisons

let info = []; // List containing sim info

function setup() {
  createCanvas(WIDTH, HEIGHT);
  myBot = new bot();
  // Populate bots list
  for (let i = 0; i < 30; i++) {
    bots.push(new bot());
  }
  // Populate foods & poisons lists
  for (let i = 0; i < 500; i++) {
    foods.push(new food());
    poisons.push(new poison());
  }
}

class bot {
  constructor(pos = new p5.Vector(random(0, 400), random(0, 400)),
    maxAcc = randomGaussian(0.4, 0.025), maxVel = randomGaussian(2.5, 1.0),
    hp = randomGaussian(400, 25), lifeSpan = randomGaussian(400, 10), ancestors = [], children = []) {
    this.id = String(Date.now()+Math.round(100*random())).slice(-3);
    if (ancestors.length > 0) {
      this.parent = ancestors[ancestors.length-1];
    }
    else {this.parent = null;}
    this.ancestors = ancestors;
    this.ancestors.push(this.parent);
    this.gen = this.ancestors.length;
    
    this.children = children;
    this.sex = Math.round(randomGaussian(0.5, 0.05));
    this.pos = pos;
    this.vel = new p5.Vector(0, 0);
    this.acc = new p5.Vector(0, 0);
    this.maxAcc = maxAcc;
    this.maxVel = maxVel;
    this.age = 0;
    this.lifeSpan = lifeSpan;
    this.hp = hp;
    this.isDead = 0;
    this.shouldBreed = 0;
    this.hasBred = 0;
    this.target = null;

  }

  getTarget(targets, allBots) {
    // After a certain age, small chance that shouldBreed -> 1
    // Bot will not search for food till it has bred and shouldBreed -> 0
    if (this.age >= 0.2 * this.lifeSpan && this.shouldBreed != 1 && this.hasBred != 1) {
      this.shouldBreed = Math.round(randomGaussian(0.4, 0.05))
    } else {
      this.shouldBreed = this.shouldBreed
    }
    // For aquiring food
    if (this.shouldBreed == 0) {
      for (let i = 0; i < targets.length; i++) {
        // base case
        if (this.target == null) {
          this.target = targets[i];
        }
        // update target if closer
        else if (p5.Vector.dist(targets[i].pos, this.pos) < p5.Vector.dist(this.target.pos, this.pos)) {
          this.target = targets[i];
        }
        // on collision with food
        else if (p5.Vector.dist(this.pos, targets[i].pos) < 4 && this.target == targets[i]) {
          this.hp += 10;
          targets.splice(i, 1);
          this.target = null;
        }
      }
      if (this.target == null) {
        this.target = targets[0];
      } else if (targets.includes(this.target) == false) {
        this.target = targets[0];
      }
    } else if (this.shouldBreed == 1) {
      // When comparing mates, # foods & stats are determining factors for P(pick mate)
      // base case
      // update matesList
      this.matesList = [...allBots];
      this.matesList.splice(this.matesList.indexOf(this), 1);
      for (let i = 0; i < this.matesList.length; i++) {
        // base case
        if (this.target == null || this.matesList.includes(this.target) == false) {
          if (this.matesList[i].age >= 0.2 * this.matesList[i].lifeSpan && this.matesList[i].sex != this.sex && this.matesList[i].isDead == 0) {
            this.target = this.matesList[i];
          }
        }
        // case for selecting most suitable mate
        // P(update_mate) = (age > 0.2*lifespan) * (maxVel * maxAcc * HP)
        else if (p5.Vector.dist(this.matesList[i].pos, this.pos) < p5.Vector.dist(this.target.pos, this.pos) && this.matesList[i].age >= 0.2 * this.matesList[i].lifeSpan && (this.matesList[i].maxVel * this.matesList[i].maxAcc * this.matesList[i].HP) > (this.target.maxVel * this.target.maxAcc * this.target.HP)) {
          this.target = this.matesList[i];
        }


        // on collision with mate
        else if (p5.Vector.dist(this.pos, this.target.pos) < 4 && this.target.isDead == 0) {
          bots.push(new bot(new p5.Vector(random(this.pos.x - 5, this.pos.x + 5), random(this.pos.y - 5, this.pos.y + 5)),
            randomGaussian(this.maxAcc, 0.025), 
            randomGaussian(this.maxVel, 1.0),
            randomGaussian(this.hp, 25),
            randomGaussian(this.lifeSpan, 10),
            this.ancestors));
          // bots[bots.length - 1].ancestors.push(this.id)
          // print(bots[bots.length - 1].ancestors);
          this.children.push(bots[bots.length - 1].id);
          this.target = null;
          this.shouldBreed = 0;
          this.hasBred = 1;
          break;
        }
      }


    }
    // on collision with poison (regardless of shouldBreed = 0 or 1)
    for (let i = 0; i < poisons.length; i++) {
      if (p5.Vector.dist(this.pos, poisons[i].pos) < 4) {
        poisons.splice(i, 1);
        this.hp -= 10;
      }
    }

  }

  seek() {
    if (this.target == null) {
      this.target = foods[0];
    }
    this.desired = p5.Vector.sub(this.target.pos, this.pos);
    this.desired.setMag(this.maxVel);
    this.acc = p5.Vector.sub(this.desired, this.vel);
    this.acc.limit(this.maxAcc);
    this.vel = this.vel.add(this.acc);
    this.vel.limit(this.maxVel);
    this.pos = this.pos.add(this.vel);

    if (this.pos.x < 10 || this.pos.x > 390) {
      this.acc.x = 0;
      this.vel.x = 0;
    } else if (this.pos.y < 10 || this.pos.y > 390) {
      this.acc.y = 0;
      this.vel.y = 0;
    }

  }

  ageing() {
    if (this.age > this.lifeSpan) {
      this.isDead = 1;
      this.hp = 0;
      this.age = this.lifeSpan;
    }
    this.age += 0.01;

    if (this.hp > 0) {
      this.hp -= 0.1;
    } else if (this.hp <= 0) {
      this.isDead = 1;
      this.maxAcc = 0;
      this.maxVel = 0;
    }

  }
  display() {
    noStroke();
    this.aColor = color(166, 191, 169);
    fill(this.aColor);
    ellipse(this.pos.x, this.pos.y, 15);
    for (let i = 1; i < 7; i++) {
      this.aColor.setAlpha(192 / i);
      fill(this.aColor);
      ellipse(this.pos.x - this.vel.x * i * 0.9, this.pos.y - this.vel.y * i * 0.9, 15 - i);
    }
    if (this.hp <= 0) {
      fill(200);
    } else if (this.shouldBreed == 1) {
      fill(255, 0, 0);
    } else {
      fill(32, 54, 34);
    }
    ellipse(this.pos.x, this.pos.y, 10);
  }

}

class food {
  constructor() {
    this.pos = new p5.Vector(random(100, 390), random(100, 390));

  }

  display() {

    noStroke();
    fill(50, 205, 50);
    ellipse(this.pos.x, this.pos.y, 5, 5);
  }

}

class poison {
  constructor() {
    this.pos = new p5.Vector(random(10, 390), random(10, 390));

  }

  display() {
    noStroke();
    fill(220, 20, 60);
    ellipse(this.pos.x, this.pos.y, 5, 5);
  }

}

function draw() {
  background(235, 245, 236);
  fill(100);
  rect(400, 0, 550, 400);
  textAlign(LEFT);
  for (let i = 0; i < bots.length; i++) {
    bots[i].ageing();
    bots[i].getTarget(foods, bots);
    bots[i].seek();
    bots[i].display();
    fill(255);
    if (bots[i].isDead == 0) {
      info.push("ID: " + bots[i].id + "   Gen: " + bots[i].gen +"   Parent: "+ bots[i].parent +"   Child: "+bots[i].children+"   Age: " + Math.round(bots[i].age) + " / " + Math.round(bots[i].lifeSpan) + "   HP: " + Math.round(bots[i].hp) + "   Sex: " + bots[i].sex + "   Max Vel: " + Math.round(bots[i].maxVel) + "   Max Acc: " + Math.round(bots[i].maxAcc * 100) / 100);
    } else if (bots[i].isDead == 1) {
      bots.splice(i, 1);
    }
  }

  // Draw food
  for (let i = 0; i < foods.length; i++) {
    foods[i].display();
  }
  // Draw poison
  for (let i = 0; i < poisons.length; i++) {
    poisons[i].display();
  }
  // Chance to repopulate foods list
  if (foods.length < 5) {
    for (let i = 0; i < 10 - foods.length; i++) {
      if (Math.abs(randomGaussian(0, 0.25)) > 0.35) {
        foods.push(new food());
      }
    }
  }
  // Chance to repopulate poisons list
  if (poisons.length < 2) {
    for (let i = 0; i < 10 - poisons.length; i++) {
      if (Math.abs(randomGaussian(0, 0.25)) > 0.5) {
        poisons.push(new poison());
      }
    }
  }
  // Display simulation info
  fill(255);
  for (let i = 0; i < info.length; i++) {
    text(info[i], 410, 15 + i * 18);
  }
  info = [];

}
