"use strict";

// DOM + SVG Setup
const screen = document.getElementById("screen");
const xmlns = "http://www.w3.org/2000/svg";
const xlinkns = "http://www.w3.org/1999/xlink";

let width = window.innerWidth;
let height = window.innerHeight;
const pointer = { x: width / 2, y: height / 2 };
let rad = 0, frm = Math.random(), radm = Math.min(pointer.x, pointer.y) - 20;

const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
};
window.addEventListener("resize", resize, false);

// Dragon parts
const N = 40;
const elems = [];
for (let i = 0; i < N; i++) elems[i] = { use: null, x: width / 2, y: 0 };

const prepend = (use, i) => {
    const elem = document.createElementNS(xmlns, "use");
    elems[i].use = elem;
    elem.setAttributeNS(xlinkns, "xlink:href", "#" + use);
    screen.prepend(elem);
};
for (let i = 1; i < N; i++) {
    if (i === 1) prepend("Cabeza", i);
    else if (i === 8 || i === 14) prepend("Aletas", i);
    else prepend("Espina", i);
}

// Animation Loop
const run = () => {
    requestAnimationFrame(run);
    let e = elems[0];
    const ax = Math.cos(3 * frm) * rad * width / height;
    const ay = Math.sin(4 * frm) * rad * height / width;
    e.x += (ax + pointer.x - e.x) / 10;
    e.y += (ay + pointer.y - e.y) / 10;
    for (let i = 1; i < N; i++) {
        let e = elems[i];
        let ep = elems[i - 1];
        const a = Math.atan2(e.y - ep.y, e.x - ep.x);
        e.x += (ep.x - e.x + (Math.cos(a) * (100 - i)) / 5) / 4;
        e.y += (ep.y - e.y + (Math.sin(a) * (100 - i)) / 5) / 4;
        const s = (162 + 4 * (1 - i)) / 50;
        e.use.setAttributeNS(null, "transform", `translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${(180 / Math.PI) * a}) scale(${s},${s})`);
    }
    if (rad < radm) rad++;
    frm += 0.002;
    if (rad > 60) {
        pointer.x += (width / 2 - pointer.x) * 0.05;
        pointer.y += (height / 2 - pointer.y) * 0.05;
    }
};
run();

// ==== 👇 MediaPipe Integration for Hand Tracking
const videoElement = document.createElement("video");
videoElement.style.display = "none";
document.body.appendChild(videoElement);

const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.6,
});

// Sensitivity Threshold Logic
let lastX = pointer.x;
let lastY = pointer.y;
const movementThreshold = 5; // Minimum pixel movement to update pointer

hands.onResults(results => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmark = results.multiHandLandmarks[0][8]; // index fingertip
        const newX = (1 - landmark.x) * width; // Flip X (mirror fix)
        const newY = landmark.y * height;

        const dx = newX - lastX;
        const dy = newY - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > movementThreshold) {
            pointer.x = newX;
            pointer.y = newY;
            lastX = newX;
            lastY = newY;
        }
    }
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
});
camera.start();
