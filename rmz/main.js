/* global hotas, kontra */
let { on, off, emit } = kontra;
let {
    canvas,
    context
} = kontra.init();
let sprites = [];
let playerSprite;
let uis = [];
let ha_state = {
    asteroid_dt: 0,
    asteroid_counter: 0
};
let asteroidCount = 5;
let startedTime = new Date();
let globalSpeedModifier = 1;

let mainCanvas = document.getElementById('main_canvas');
let canvasDimensions = [mainCanvas.width, mainCanvas.height];
let cvCalcD = [canvasDimensions[0] / 2, canvasDimensions[1] / 2];

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
            this.text = (((new Date()) - startedTime) / 1000).toFixed(1);
        }
    });

    uis.push(text);

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
        radius: 6, // we'll use this later for collision detection
        dt: 0, // track how much time has passed
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
        rmz_offset(source){
            this.x -= source.dx;
            this.y -= source.dy;
        },
        update() {
            let moveMult = 2;
            let hotasleft = (hotas.x() * cvCalcD[0]) + cvCalcD[0];
            let hotastop = (hotas.y() * cvCalcD[1]) + cvCalcD[1];
            let sqdiff = ((this.x - hotasleft) ** 2 + (this.y - hotastop) ** 2) ** 0.5;
            let mcos = -Math.acos((this.x - hotasleft) / (sqdiff));
            let dir = -1;
            if (hotastop > this.y) {
                dir = 1;
            }
            this.rotation = (mcos * dir) + kontra.degToRad(180); //kontra.degToRad(mcos);

            if(kontra.keyPressed('e')){
                this.dx += 0.1;
            }
            if(kontra.keyPressed('q')){
                this.dx -= 0.1;
            }
            if(kontra.keyPressed('3')){
                this.dy += 0.1;
            }
            if(kontra.keyPressed('1')){
                this.dy -= 0.1;
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
            //if (kontra.keyPressed('a') || hotas.left()) {
            if (kontra.keyPressed('a')) {
                this.rotation += kontra.degToRad(-4);
            } else if (kontra.keyPressed('d') || hotas.right()) {
                this.rotation += kontra.degToRad(4);
            } // move the ship forward in the direction it's facing
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);
            if (kontra.keyPressed('up')) {
                this.ddx = cos * 0.05;
                this.ddy = sin * 0.05;
            } else {
                this.ddx = this.ddy = 0;
            }
            this.advance(); // set a max speed
            if (this.velocity.length() > 5) {
                this.dx *= 0.95;
                this.dy *= 0.95;
            }
            if(kontra.keyPressed('z')){
                emit("slash",null);
            }
            // allow the player to fire no more than 1 bullet every 1/4 second
            this.dt += 1 / 60;
            if ((kontra.keyPressed('space') || hotas.button(0)) && this.dt > 0.25) {
                this.dt = 0;
                let bullet = kontra.Sprite({
                    type: 'bullet',
                    color: 'white',
                    // start the bullet on the ship at the end of the triangle
                    x: this.x + cos * 12,
                    y: this.y + sin * 12,
                    // move the bullet slightly faster than the ship
                    dx: this.dx + cos * 5,
                    dy: this.dy + sin * 5,
                    // live only 50 frames
                    ttl: 50,
                    // bullets are small
                    radius: 3,
                    width: 2,
                    height: 2,
                    rmz_offset(source){
                        this.x -= source.dx,
                        this.y -= source.dy
                    }
                });
                sprites.push(bullet);
            }
        }
    });

    sprites.push(ship);
    playerSprite = ship;

    for (let i = 0; i < asteroidCount; i++) {
        createAsteroid(50, 15, 30);
    }
}

function ha_initGame() {
    sprites = [];
    uis = [];
    startedTime = new Date();

    ha_initSprites();
}

function createAsteroid(x, y, radius) {
    let asteroid = kontra.Sprite({
        type: 'asteroid', // we'll use this for collision detection
        x,
        y,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
        radius,
        render() {
            this.context.strokeStyle = 'white';
            this.context.beginPath(); // start drawing a shape
            this.context.arc(0, 0, this.radius, 0, Math.PI * 2);
            this.context.stroke(); // outline the circle
        },
        rmz_offset(source){
            this.x -= source.dx;
            this.y -= source.dy;
        }
    });
    sprites.push(asteroid);
}


kontra.initKeys();

let loop = kontra.GameLoop({
    update() {
        ha_state.asteroidCounter += 1 / 60;
        ha_state.asteroid_dt += 1 / 60;
        if (hotas.button(2) && ha_state.asteroidCounter > 1) {
            asteroidCount += 1;
            ha_state.asteroidCounter = 0;
        }
        if (hotas.button(3) && ha_state.asteroidCounter > 1) {
            asteroidCount -= 1;
            ha_state.asteroidCounter = 0;
        }
        if (hotas.button(5) && ha_state.asteroid_dt > 1) {
            createAsteroid(-20, -20, 30);
            ha_state.asteroid_dt = 0;
        }
        if (hotas.button(4)) {
            ha_initGame();
        }
        uis.map(ui => {
            ui.update();
        });
        
        sprites.map(sprite => {
            sprite.update(); 
            sprite.rmz_offset(playerSprite);
            // // asteroid is beyond the left edge
            // // loop back onto canvas
            // if (sprite.x < -sprite.radius) {
            //     sprite.x = canvas.width + sprite.radius;
            // }
            // // sprite is beyond the right edge
            // else if (sprite.x > canvas.width + sprite.radius) {
            //     sprite.x = 0 - sprite.radius;
            // }
            // // sprite is beyond the top edge
            // if (sprite.y < -sprite.radius) {
            //     sprite.y = canvas.height + sprite.radius;
            // }
            // // sprite is beyond the bottom edge
            // else if (sprite.y > canvas.height + sprite.radius) {
            //     sprite.y = -sprite.radius;
            // }
        });
        // collision detection
        for (let i = 0; i < sprites.length; i++) {
            // only check for collision against asteroids
            if (sprites[i].type === 'asteroid') {
                for (let j = 0; j < sprites.length; j++) {
                    // don't check asteroid vs. asteroid collisions
                    if (sprites[j].type !== 'asteroid') {
                        let asteroid = sprites[i];
                        let sprite = sprites[j];
                        // circle vs. circle collision detection
                        let dx = asteroid.x - sprite.x;
                        let dy = asteroid.y - sprite.y;
                        if (Math.hypot(dx, dy) < asteroid.radius + sprite.radius) {
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
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render() {
        sprites.map(sprite => sprite.render());
        uis.map(ui => ui.render());
    }
});

loop.start();
ha_initGame();
