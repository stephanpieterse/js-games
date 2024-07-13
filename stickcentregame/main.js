
var FRAME_SEC_TARGET = 60;
var updateIntervalMs = 1000 / FRAME_SEC_TARGET;
var regeneratorIntervalMs = 3000;
var frameDivisor = (regeneratorIntervalMs / updateIntervalMs);
var successThreshold = 85;
var smoothingFrames = 3;

var smoothInputDegradation = true;
var dampening = 50;

var skyGridPos = [500, 400];

var sizeOffset = 100;

var playonoff = true;

var redBlockSize = 10;
var redBlockSizeD2 = redBlockSize / 2;

var greenBlockSize = 6;
var greenBlockSizeD2 = greenBlockSize / 2;

var steps = {
    "throttle": 0,
    "rudder": 0,
    "X": 0,
    "Y": 0
};

var inputCurrent = {
    "throttle": 0,
    "rudder": 0,
    "X": 0,
    "Y": 0
};

var inputHistory = {
    "throttle": [0],
    "rudder": [0],
    "X": [0],
    "Y": [0]
};

var inputHistoryAvg = {
    "throttle": 0,
    "rudder": 0,
    "X": 0,
    "Y": 0
};
// JSON.parse(JSON.stringify());
var positions = {
    "throttle": 0,
    "rudder": 0,
    "X": 0,
    "Y": 0
};
var points = {
    "throttle": 0,
    "rudder": 0,
    "X": 0,
    "Y": 0
};

var enabledAxis = {
    "throttle": 1,
    "rudder": 1,
    "X": 1,
    "Y": 1
};
var stepDistance;

var joySensitivity = 5; //3; //0.5;

var joyId = -1;
var throttleId = -1;


let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");


function mapJoys() {
    for (var j in navigator.getGamepads()) {
        if (navigator.getGamepads()[j].id.indexOf("Thrustmaster T.16000M") >= 0) {
            joyId = parseInt(j);
        }
        if (navigator.getGamepads()[j].id.indexOf("Thrustmaster TWCS Throttle") >= 0) {
            throttleId = parseInt(j);
        }
    }
}

mapJoys();

function getGamepads(jid) {
    if (jid == -1) {
        return {
            axes: [0, 0, 0, 0, 0, 0, 0, 0]
        };
    }
    return navigator.getGamepads()[jid];
}

function smoothHistory() {
    for (var p in inputCurrent) {
        if (smoothInputDegradation) {
            inputHistory[p] = inputHistory[p].map(function (el, i) { return el * i / (i + 1); });
        }
        inputHistory[p].push(inputCurrent[p]);
        while (inputHistory[p].length > smoothingFrames) {
            inputHistory[p].shift();
        }
        inputHistoryAvg[p] = inputHistory[p].reduce(function (a, b) { return a + b; }, 0) / smoothingFrames;
    }
}

function getJoyInputs() {
    var x = joySensitivity * getGamepads(joyId).axes[0];
    var y = -1 * joySensitivity * getGamepads(joyId).axes[1];

    inputCurrent["X"] = x;
    inputCurrent["Y"] = y;

    var r = joySensitivity * getGamepads(throttleId).axes[6];
    inputCurrent["rudder"] = r;

    var t = joySensitivity * getGamepads(throttleId).axes[2];
    inputCurrent["throttle"] = t;
}

function regenerator() {
    for (var id in steps) {
        if (!enabledAxis[id]){
          steps[id] = 0;
          continue;
        }
        var newTarget = (Math.random() * (sizeOffset * 2)) - sizeOffset;
        var stepLength = (Math.abs(positions[id] - newTarget)) / frameDivisor; /// updateIntervalMs;
        var stepDirection = newTarget > positions[id] ? 1 : -1;
        stepDistance = stepLength * stepDirection;
        steps[id] = stepDistance;
    }
}
regenerator();

function clearDrawArea() {
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, 1920, 1080);
}

function pointsCalculator(pos) {
    var p = sizeOffset - pos;
    if (p < successThreshold) {
        p = -p;
    }
    return p * successThreshold / sizeOffset / updateIntervalMs;
}

function updatePoints() {
    points["X"] += pointsCalculator(Math.abs(positions["X"]));
    points["Y"] += pointsCalculator(Math.abs(positions["Y"]));
    points["throttle"] += pointsCalculator(Math.abs(positions["throttle"]));
    points["rudder"] += pointsCalculator(Math.abs(positions["rudder"]));
}

function drawBlock(tctx, offset, exy) {

    tctx.translate(offset[0], offset[1]);
    tctx.fillStyle = "rgb(255, 0, 0)";
    tctx.fillRect(exy[0] - redBlockSizeD2, exy[1] - redBlockSizeD2, redBlockSize, redBlockSize);
    tctx.resetTransform();
}

function drawInternalView(tctx) {
    tctx.translate(skyGridPos[0], skyGridPos[1] + positions["Y"]);
    // ctx.rotate(positions["X"]  * Math.PI / 180);
    tctx.rotate((positions["X"] / 100 * 90) * Math.PI / 180);
    tctx.beginPath();
    tctx.lineWidth = "2";
    tctx.strokeStyle = "green";
    tctx.rect(-sizeOffset, -2, sizeOffset * 2, 2);
    tctx.stroke();
    tctx.beginPath();
    tctx.lineWidth = "1";
    tctx.strokeStyle = "white";
    tctx.rect(-10, -10, 2, 10);
    tctx.rect(10, -10, 2, 10);
    tctx.stroke();

    tctx.resetTransform();
}

function drawWoolomenter(tctx) {
    tctx.translate(skyGridPos[0], skyGridPos[1] + positions["Y"]);
    tctx.rotate((positions["X"] / 100 *90 ) * Math.PI / 180);
    tctx.rotate((180 + ((positions["rudder"]+sizeOffset) / (sizeOffset*2) * 180)) * Math.PI / 180);
    tctx.beginPath();
    tctx.lineWidth = "2";
    tctx.strokeStyle = "white";
    tctx.rect(0, 0, sizeOffset/2 , 2);
    tctx.stroke();

    tctx.resetTransform();
}

function drawChaseObject(tctx) {
    tctx.translate(skyGridPos[0], skyGridPos[1] + positions["Y"]);
    // ctx.rotate(positions["X"]  * Math.PI / 180);
    tctx.rotate((positions["X"] / 100 * 90) * Math.PI / 180);
    tctx.translate(0, -10);

    var sscale = 2 - (positions["throttle"] / 100 * 2);

    tctx.fillStyle = "rgb(255, 0, 0)";
    tctx.fillRect(positions["throttle"], -10, 10 * sscale, 10 * sscale);

    tctx.resetTransform();
    let cval =0;
    drawBlock(ctx, skyGridPos, [0, sizeOffset + cval]);
}

function drawSky(ctx) {
    // Create gradient
    //const grd = ctx.createLinearGradient(skyGridPos[0] - positions["X"], skyGridPos[1] - 100 - positions["Y"], skyGridPos[0] + positions["X"], skyGridPos[1] + 100 - positions["Y"]);
    const grd = ctx.createLinearGradient(skyGridPos[0] - positions["X"], skyGridPos[1] - 100 - positions["throttle"], skyGridPos[0] + positions["X"], skyGridPos[1] + 100 - positions["throttle"]);
    grd.addColorStop(0, "rgb(50,120,255)");
    grd.addColorStop(0.4, "blue");
    grd.addColorStop(0.5, "brown");
    grd.addColorStop(1, "rgb(120,50,0)");
    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(skyGridPos[0] /2, skyGridPos[1] / 3, 500, 500);
    ctx.resetTransform();
}

function drawContainer(tctx, offset, exy) {

    // outer edge
    tctx.translate(offset[0], offset[1]);
    tctx.beginPath();
    tctx.lineWidth = "2";
    tctx.strokeStyle = "black";
    tctx.rect(0, 0, exy[0], exy[1]);
    tctx.stroke();

    // middle marker
    tctx.fillStyle = "rgb(0, 255, 0)";
    tctx.fillRect(exy[0] / 2 - greenBlockSizeD2, exy[1] / 2 - greenBlockSizeD2, greenBlockSize, greenBlockSize);

    tctx.resetTransform();
}

function updatePositionLoop() {
    drawBlock(ctx, [80, 100], [0, sizeOffset + positions["throttle"]]);
    drawContainer(ctx, [80, 100], [10, sizeOffset * 2]);

    drawBlock(ctx, [100, 100], [sizeOffset + positions["X"], sizeOffset + positions["Y"]]);
    drawContainer(ctx, [100, 100], [sizeOffset * 2, sizeOffset * 2]);

    drawBlock(ctx, [100, 310], [sizeOffset + positions["rudder"], 0]);
    drawContainer(ctx, [100, 310], [sizeOffset * 2, 10]);
}

function pointsSum() {
    var total = 0;
    for (var p in points) {
        total += points[p];
    }
    var d = document.getElementById("stats");
    d.innerHTML = "Points : " + parseInt(total) + "   ";
}

function limitPositions() {
    for (var p in positions) {
        positions[p] = Math.min(sizeOffset, positions[p]);
        positions[p] = Math.max(-sizeOffset, positions[p]);
    }
}

var regeneratorTimout;

function regeneratorSetter() {
    regeneratorTimout = setTimeout(function () {
        regenerator();
        regeneratorSetter();
    }, regeneratorIntervalMs);
}
regeneratorSetter();

function stepUpdateAllPositions() {
    for (var id in positions) {
        positions[id] += steps[id];
    }
}

var mainLoopInterval = setInterval(function () {
    clearDrawArea();
    drawSky(ctx);
    updatePoints();

    pointsSum();

    if (playonoff) {
        stepUpdateAllPositions();
    }

    updatePositionLoop();

    drawInternalView(ctx);
    //drawChaseObject(ctx);
    drawWoolomenter(ctx);

    mapJoys();
    getJoyInputs();

    limitPositions();

    smoothHistory();

    for (var p in inputCurrent) {
        //positions[p] += inputCurrent[p];
        // positions[p] += inputHistoryAvg[p] * (sizeOffset) * (dampening/100); // / FRAME_SEC_TARGET; //updateIntervalMs;
        positions[p] += inputHistoryAvg[p] * ((100 - dampening) / 100);
    }

    successThreshold = parseInt(document.getElementById("settings_difficulty").value);
    regeneratorIntervalMs = parseInt(document.getElementById("settings_easing").value);
    frameDivisor = (regeneratorIntervalMs / updateIntervalMs);
    smoothingFrames = parseInt(document.getElementById("settings_smoothing").value);
    dampening = parseInt(document.getElementById("settings_dampening").value);
    playonoff = document.getElementById("settings_playonoff").checked;
    enabledAxis['X'] = document.getElementById("settings_enabledaxis_x").checked;
    enabledAxis['Y'] = document.getElementById("settings_enabledaxis_y").checked;
    enabledAxis['throttle'] = document.getElementById("settings_enabledaxis_t").checked;
    enabledAxis['rudder'] = document.getElementById("settings_enabledaxis_r").checked;
}, updateIntervalMs);

