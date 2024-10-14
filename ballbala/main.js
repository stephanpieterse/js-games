let wx, wy = 100;


let engine = Matter.Engine.create();
engine.gravity.y = 0;

let ballbala = {
  screen: {
    width: window.innerWidth * 0.80,
    height: window.innerHeight * 0.80
  },
  obstacles: [],
  lastObstacleAdded: 0,
  gameStarted: new Date(),
  settings: {
    spawnTime: 30000,
    max_obstacles: 5,
    steps: 180,
    sensitivity_r: 45,
    sensitivity_x: 100,
    sensitivity_y: 300
  }
}

let render = Matter.Render.create({
  element: document.getElementById('matter'),
  engine: engine,
  options: {
    hasBounds: true,
    width: ballbala.screen.width,
    height: ballbala.screen.height,
    wireframes: false,
    showVelocity: false,
    showAngleIndicator: false
  }
});
Matter.Render.run(render);

let runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

let square = Matter.Bodies.rectangle(ballbala.screen.width / 2, 300, 325, 35, {
  isStatic: false,
  friction: 0.001,
  // mass: 1
});
Matter.Composite.add(engine.world, square);

ballbala.colliderTimer = setInterval(function () {
  addCollider();
}, ballbala.settings.spawnTime)

function addCollider() {
  if (ballbala.obstacles.length >= ballbala.settings.max_obstacles){
    console.log('max obstacles reached');
    return;
  }
  if (((new Date())) - ballbala.lastObstacleAdded < 1800) {
    return;
  }
  let collo = Matter.Bodies.rectangle(200, 600, 30, 30, {
    _ballbala: { px: Math.random() * (ballbala.screen.width), py: Math.random() * (ballbala.screen.height), ps: parseInt(Math.random() * ballbala.settings.steps) },
    isStatic: true,
    friction: 0.1,
    frictionStatic: 0.1,
    render: {
      fillStyle: '#ee1111'
    }
  });
  Matter.Composite.add(engine.world, collo);
  ballbala.obstacles.push(collo);
  ballbala.lastObstacleAdded = new Date();
}

let ss = Matter.Bodies.circle(50 - 100 * Math.random() + square.position.x, 100, 15, {
  isStatic: false,
  friction: 0.002,
  restitution: 0.1,
  frictionAir: 0,
  mass: 1
});
Matter.Composite.add(engine.world, ss);


// visual centering loop for when there is a external reference points
// Matter.Events.on(render, 'beforeRender', function(){
//   var viewportCentre = {
//     x: render.bounds.min.x + (render.bounds.max.x - render.bounds.min.x) / 2,
//     y: render.bounds.min.y + (render.bounds.max.y - render.bounds.min.y) / 2
//   };

//   var deltaCentre = Matter.Vector.sub(square.position, viewportCentre);
//   // var deltaCentre = Matter.Vector.sub(viewportCentre, square.position);
//   console.log(viewportCentre, square.position, deltaCentre);
//             centreDist = Matter.Vector.magnitude(deltaCentre);

//              var direction = Matter.Vector.normalise(deltaCentre)
//             //  console.log(direction)
//                 let speed = Math.min(10, Math.pow(centreDist, 2) * 0.0001);

//                 translate = Matter.Vector.mult(direction, speed);

//   Matter.Bounds.translate(render.bounds, translate);
//   // Matter.Bounds.setPosition(render.bounds,square.position)

// });

// MAIN LOOP
Matter.Events.on(engine, 'beforeUpdate', function (event) {

  for (let inp of document.getElementById('settings').getElementsByTagName('input')) {
    let namearr = inp.name.split('_');
    namearr.shift()
    let setting = namearr.join('_');
    let value = inp.value;
    if (inp.type == "range" || inp.type == "number") {
      value = parseInt(value);
    }
    ballbala.settings[setting] = value;

  };



  Matter.Body.applyForce(ss, ss.position, { x: 0, y: 0.001 });


  if (hotas.button(1)) {
    window.location.reload(false)
  }

  if (hotas.button(2)) {
    addCollider();
  }

  Matter.Body.applyForce(square, square.position, {
    x: hotas.x() / ballbala.settings.sensitivity_x,
    y: hotas.throttle() / ballbala.settings.sensitivity_y
  });
  // Matter.Body.translate(square, {
  //   x: hotas.x() * 8,//* ballbala.settings.sensitivity_x,
  //   y: hotas.throttle() *8// 2* ballbala.settings.sensitivity_y
  // }, true);
  Matter.Body.rotate(square, (-hotas.pedals() / ballbala.settings.sensitivity_r), square.position, false);
  ballbala.obstacles.forEach((e) => {
    let steps = ballbala.settings.steps;
    e._ballbala.ps = (e._ballbala.ps + 1) % steps;
    if (e._ballbala.ps == 0) {
      e._ballbala.px = parseInt(Math.random() * (ballbala.screen.width))
      e._ballbala.py = parseInt(Math.random() * (ballbala.screen.height))
    }

    let nx = (e._ballbala.px - e.position.x) / steps;
    let ny = (e._ballbala.py - e.position.y) / steps;
    Matter.Body.setPosition(e, { x: e.position.x + nx, y: e.position.y + ny })
  })

  if (isBodyOnScreen(ss, ballbala.screen)) {
    //   all is well
  } else {
    if (ballbala.gameEnded) {

    } else {
      // Matter.Composite.remove(ss);
      ballbala.gameEnded = new Date();
      document.getElementById('stats').innerHTML = "Time :: " + ((ballbala.gameEnded - ballbala.gameStarted) / 1000);
      clearInterval(ballbala.colliderTimer);
    }

  }
});

function isBodyOnScreen(body, screen) {
  if (body.position.x < 0 || body.position.y < 0) {
    return false;
  }

  if (body.position.x > screen.width || body.position.y > screen.height) {
    return false;
  }

  return true;
}


let keydownCallbacks = {};
let keyupCallbacks = {};
let pressedKeys = {}

function addKDCB(key, fn) {
  if (!keydownCallbacks[key]) {
    keydownCallbacks[key] = [];
  }
  keydownCallbacks[key].push(fn);
}

function keydownEventHandler(ev) {
  // console.log(ev)
  pressedKeys[ev.key] = true;
  (keydownCallbacks[ev.key] || []).forEach((fn) => {
    fn(ev);
  })
}

function keyupEventHandler(ev) {
  pressedKeys[ev.key] = false;
}
window.addEventListener('keydown', keydownEventHandler);
window.addEventListener('keyup', keyupEventHandler);

addKDCB('?', function () {
  document.getElementById('settings').classList.replace('hide', 'show')
});

document.getElementById('settings').getElementsByClassName('close')[0].addEventListener('click', function () {
  document.getElementById('settings').classList.replace('show', 'hide')
})

function saveSettings() {

}

function loadSettings() {

}