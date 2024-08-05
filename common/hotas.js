/* global navigator */
let emptyGamepad = {
    axes: [0, 0, 0, 0, 0, 0, 0, 0],
    buttons: (() => {
        let ret = [];
        for (let i = 0; i < 8; i++) {
            ret.push({
                pressed: false,
                touched: false
            });
        }
        return ret;
    })()
};

let hotasJoyConfig = {
    joy1: "Thrustmaster T.16000M",
    joy2: "Thrustmaster TWCS Throttle",
};

function getGamepads(jid) {
    if (jid === -1 || (navigator === undefined || navigator.getGamepads === undefined)) {
        return emptyGamepad;
    }
    return navigator.getGamepads()[jid];
}

let hotas = {
    rounding: 2,
    stickId: -1,
    stickButtons: 16,
    stickAxes: 4,
    throttleId: -1,
    throttleButtons: 16,
    throttleAxes: 6,
    axes: function(stick, ax) {
        if (ax < this.stickAxes) {
            return getGamepads(this.stickId).axes[ax];
        } else {
            return getGamepads(this.throttleId).axes[ax - this.stickAxes];
        }
    },
    button: function(num) {
        if (num < this.stickButtons) {
            return getGamepads(this.stickId).buttons[num].pressed;
        } else {
            return getGamepads(this.throttleId).buttons[num - this.stickButtons].pressed;
        }
    },
    x: function() {
        return Number((getGamepads(this.stickId).axes[0]).toFixed(this.rounding));
    },
    y: function() {
        return Number((getGamepads(this.stickId).axes[1]).toFixed(this.rounding));
    },
    pedals: function() {
        return Number((getGamepads(this.throttleId).axes[6]).toFixed(this.rounding));
    },
    throttle: function() {
        return Number((getGamepads(this.throttleId).axes[2]).toFixed(this.rounding));
    },
    left: function() {
        return this.x() < 0 ? this.x() : 0;
    },
    right: function() {
        return this.x() > 0 ? this.x() : 0;
    },
    up: function() {
        return this.y() < 0 ? this.y() : 0;
    },
    down: function() {
        return this.y() > 0 ? this.y() : 0;
    },
    yaw_left: function() {
        return this.pedals() < 0 ? this.pedals() : 0;
    },
    yaw_right: function() {
        return this.pedals() > 0 ? this.pedals() : 0;
    },
    throttle_up: function() {
        return this.throttle() < 0 ? this.throttle() : 0;
    },
    throttle_down: function() {
        return this.throttle() > 0 ? this.throttle() : 0;
    },
};

function mapJoys() {
    let joyname = hotasJoyConfig.joy1;
    let throttlename = hotasJoyConfig.joy2;
    for (var j in navigator.getGamepads()) {
        if (navigator.getGamepads()[j].id.indexOf(joyname) >= 0) {
            hotas.stickId = parseInt(j);
            hotas.stickButtons = navigator.getGamepads()[j].buttons.length;
            hotas.stickAxes = navigator.getGamepads()[j].axes.length;
        }
        if (navigator.getGamepads()[j].id.indexOf(throttlename) >= 0) {
            hotas.throttleId = parseInt(j);
            hotas.throttleButtons = navigator.getGamepads()[j].buttons.length;
            hotas.throttleAxes = navigator.getGamepads()[j].axes.length;
        }
    }
}

mapJoys();
let hotasMapInterval = setInterval(mapJoys, 1000);
