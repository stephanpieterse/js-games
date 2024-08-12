/*
    TASKS:
    
*/

let {
    canvas,
    context
} = kontra.init();
let sprites = [];
let playerSprite;
let uis = [];
let ha_state = {
    asteroid_dt: 0,
    asteroid_counter: 0,
    gamerunning: true,
    endedtime: 0,
    score: 0
};
let startedTime = new Date();
let globalSpeedModifier = 1;

let mainCanvas = document.getElementById('main_canvas');
let canvasDimensions = [mainCanvas.width, mainCanvas.height];
let cvCalcD = [canvasDimensions[0] / 2, canvasDimensions[1] / 2];

let buttonMappings = {
    lessAsteroid: 3,
    moreAsteroid: 2,
    addAsteroid: 5,
    restart: 4,
    fireBullet: 0,
};

let axesMappings = {
    globalSpeedModifier: 1
}

function ha_initSprites() {
    let text = kontra.Text({
        text: 'Time',
        font: '16px Arial',
        color: 'white',
        x: 35,
        y: 35,
        anchor: { x: 0.5, y: 0.5 },
        textAlign: 'center',
        update() {
            if (ha_state.gamerunning) {
                this.text = (((new Date()) - startedTime) / 1000).toFixed(1);
            } else {
                this.text = ((ha_state.endedtime - startedTime) / 1000).toFixed(1);
            }

        }
    });
    uis.push(text);

    let score = kontra.Text({
        text: 'Time',
        font: '16px Arial',
        color: 'white',
        x: 35,
        y: 70,
        anchor: { x: 0.5, y: 0.5 },
        textAlign: 'center',
        update() {

            this.text = ha_state.score;


        }
    });
    uis.push(score);

    let crosshair = kontra.Sprite({
        x: cvCalcD[0],
        y: cvCalcD[1],
        type: 'ui',
        render() {
            this.context.strokeStyle = 'red';
            this.context.beginPath();
            this.context.moveTo(-5, 0);
            this.context.lineTo(5, 0);
            this.context.moveTo(0, 5);
            this.context.lineTo(0, -5);
            this.context.closePath();
            this.context.stroke();
        },
        update() {
            this.x = (hotas.x() * cvCalcD[0]) + cvCalcD[0];
            this.y = (hotas.y() * cvCalcD[1]) + cvCalcD[1];
        }
    });

    uis.push(crosshair);

    let ship = kontra.Sprite({
        type: "player",
        x: cvCalcD[0],
        y: cvCalcD[1],
        radius: 6,
        dt: 0,
        end() {
            kontra.emit("gamestop")
        },
        render() {
            // draw a right-facing triangle
            this.context.strokeStyle = 'white';
            this.context.beginPath();
            this.context.moveTo(-3, -5);
            this.context.lineTo(12, 0);
            this.context.lineTo(-3, 5);
            this.context.closePath();
            this.context.stroke();
        },
        update() {
            let pthis = this;
            let moveMult = 2 * globalSpeedModifier;
            let hotasleft = (hotas.x() * cvCalcD[0]) + cvCalcD[0];
            let hotastop = (hotas.y() * cvCalcD[1]) + cvCalcD[1];
            let sqdiff = ((this.x - hotasleft) ** 2 + (this.y - hotastop) ** 2) ** 0.5;
            let acv = (this.x - hotasleft) / (sqdiff) || 0;
            let mcos = -Math.acos(acv);

            let dir = -1;
            if (hotastop > this.y) {
                dir = 1;
            }
            this.rotation = (mcos * dir) + kontra.degToRad(180); //kontra.degToRad(mcos);

            if (kontra.keyPressed('e')) {
                this.x += 1 * moveMult;
                kontra.emit("moveall", [1 * moveMult, 0])
            }
            if (kontra.keyPressed('q')) {
                this.x -= 1 * moveMult;
                kontra.emit("moveall", [-1 * moveMult, 0])
            }
            if (kontra.keyPressed('s')) {
                this.y += 1 * moveMult;
                kontra.emit("moveall", [0, 1 * moveMult])
            }
            if (kontra.keyPressed('w')) {
                this.y -= 1 * moveMult;
                kontra.emit("moveall", [0, -1 * moveMult])
            }

            if (hotas.yaw_right()) {
                this.dx = hotas.yaw_right() * moveMult;
            }
            if (hotas.yaw_left()) {
                this.dx = hotas.yaw_left() * moveMult;
            }
            if (hotas.throttle_up()) {
                this.dy = hotas.throttle_up() * moveMult;
            }
            if (hotas.throttle_down()) {
                this.dy = hotas.throttle_down() * moveMult;
            }
            if (kontra.keyPressed('a') || hotas.left()) {
                this.rotation += kontra.degToRad(-4);
            } else if (kontra.keyPressed('d') || hotas.right()) {
                this.rotation += kontra.degToRad(4);
            }
            // move the ship forward in the direction it's facing
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);

            this.advance(); // set a max speed
            if (this.velocity.length() > 5) {
                this.dx *= 0.95;
                this.dy *= 0.95;
            }
            if (kontra.keyPressed('z')) {
                kontra.emit("hitbat", { radius: 200, x: this.x, y: this.y, rotation: this.rotation });
            }

            // allow the player to fire no more than 1 bullet every 1/4 second
            this.dt += 1 / 60;
            if ((kontra.keyPressed('space') || hotas.button(buttonMappings.fireBullet)) && this.dt > 0.25) {
                this.dt = 0;
                console.log(pthis);
                kontra.emit("shootbullet", {
                    x: pthis.x,
                    y: pthis.y,
                    dx: pthis.dx,
                    dy: pthis.dy,
                    cos: cos, sin: sin
                });
            }
        }
    });

    sprites.push(ship);
    playerSprite = ship;

    let asteroidCount = 1;
    for (let i = 0; i < asteroidCount; i++) {
        createAsteroid(Math.random() * 100, Math.random() * 100, 15);
    }
}

function checkCircleCollision(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.hypot(dx, dy) < a.radius + b.radius;
}

function playerHitBat(psprite) {
    sprites.forEach(sprite => {
        if (sprite.type === 'asteroid') {
            let asteroid = sprite;

            if (checkCircleCollision(asteroid, psprite)) {
                asteroid.ttl = 30
                console.log(psprite);
                asteroid.dx += Math.cos(psprite.rotation) * 2;
                asteroid.dy += Math.sin(psprite.rotation) * 2;
                console.log('hit something');
            }
        }
    });
}

function playerShootBullet(opts) {
    console.log('shot')
    console.log(opts)
    let bullet = kontra.Sprite({
        type: 'bullet',
        color: 'white',
        // start the bullet on the ship at the end of the triangle
        x: opts.x, //+ opts.cos * 12,
        y: opts.y, //+ opts.sin * 12,
        // move the bullet slightly faster than the ship
        dx: opts.dx + opts.cos * 5 * globalSpeedModifier,
        dy: opts.dy + opts.sin * 5 * globalSpeedModifier,
        ttl: 60,
        radius: 3,
        width: 2,
        height: 2,
    });
    sprites.push(bullet);
}

function ha_initGame() {
    sprites = [];
    uis = [];
    startedTime = new Date();

    ha_initSprites();
    kontra.on("hitbat", playerHitBat);
    kontra.on("shootbullet", playerShootBullet);
    kontra.on("gamestop", function () {
        ha_state.endedtime = new Date();
        ha_state.gamerunning = false;
    })
    kontra.on("moveall", function (pos) {
        sprites.forEach(sprite => {
            sprite.x -= pos[0];
            sprite.y -= pos[1];
        })
    })
}

function createAsteroid(x, y, radius) {
    ha_state.asteroid_counter += 1;
    let asteroid = kontra.Sprite({
        type: 'asteroid', // we'll use this for collision detection
        x,
        y,
        // dx: Math.random() * 2 - 1,
        // dy: Math.random() * 2 - 1,
        radius,
        render() {
            this.context.strokeStyle = 'white';
            this.context.beginPath(); // start drawing a shape
            this.context.arc(0, 0, this.radius, 0, Math.PI * 2);
            this.context.moveTo(0, 0)
            this.context.lineTo(this.radius, 0);
            this.context.stroke(); // outline the circle
            this.context.closePath();
        },
        update() {
            this.advance()
            this.rotation = kontra.angleToTarget(this, playerSprite)
            this.x += Math.cos(this.rotation) * globalSpeedModifier
            this.y += Math.sin(this.rotation) * globalSpeedModifier
        }
    });
    sprites.push(asteroid);
}


kontra.initKeys();

let loop = kontra.GameLoop({
    update() {
        ha_state.asteroidCounter += 1 / 60;
        ha_state.asteroid_dt += 1 / 60;
        if (hotas.button(buttonMappings.moreAsteroid) && ha_state.asteroidCounter > 1) {
            asteroidCount += 1;
            ha_state.asteroidCounter = 0;
        }
        if (hotas.button(buttonMappings.lessAsteroid) && ha_state.asteroidCounter > 1) {
            asteroidCount -= 1;
            ha_state.asteroidCounter = 0;
        }
        if (hotas.button(buttonMappings.addAsteroid) && ha_state.asteroid_dt > 1) {
            createAsteroid(-20, -20, 30);
            ha_state.asteroid_dt = 0;
        }
        if (hotas.button(buttonMappings.restart)) {
            ha_initGame();
        }
        uis.forEach(ui => {
            ui.update();
        });

        sprites.forEach(sprite => {
            sprite.update();
        });
        // collision detection
        for (let i = 0; i < sprites.length; i++) {
            if (sprites[i].type === 'asteroid') {
                for (let j = 0; j < sprites.length; j++) {
                    if (sprites[j].type == 'asteroid') {
                        // repel others a bit
                        let asteroid = sprites[i];
                        let sprite = sprites[j];
                        if (checkCircleCollision(asteroid, sprite)) {
                            asteroid.x += (asteroid.x - sprite.x) / 30
                            asteroid.y += (asteroid.y - sprite.y) / 30
                        }
                    }

                    if (sprites[j].type !== 'asteroid') {
                        let asteroid = sprites[i];
                        let sprite = sprites[j];

                        if (checkCircleCollision(asteroid, sprite)) {
                            asteroid.ttl = 0;
                            sprite.ttl = 0;
                            // asteroid.deathAnim();
                            // // split the asteroid only if it's large enough
                            // if (asteroid.radius > 10) {
                            //     for (let i = 0; i < 3; i++) {
                            //         createAsteroid(asteroid.x, asteroid.y, asteroid.radius / 2.5);
                            //     }
                            // }
                            break;
                        }
                    }
                }
            }
        }
        sprites = sprites.filter(sprite => {
            if (sprite.isAlive()) {
                return true
            } else {
                if (sprite.end) {
                    sprite.end()
                }
                return false
            }
        });

    },
    render() {
        sprites.forEach(sprite => sprite.render());
        uis.forEach(ui => ui.render());
    }
});

loop.start();
ha_initGame();
