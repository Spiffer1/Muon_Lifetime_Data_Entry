/* Muon Lifetime Measurement Tool - GitHub Pages Baseline Test
 * Debug Version: Uses relative path images inside the repository
 */

let img;
let fileList = [
  "images/scope1.png",  // Add your image relative paths here
  "images/scope2.png"
];
let currentImageIndex = 0;

const scaleFactor = 2.0;
const defaultTime0 = 62.5 * scaleFactor;
let settingTime0 = false;
let imageProcessingComplete = false;

let xTime0 = defaultTime0;
let pulseXs = [];
let pulseYs = [];
let savedTimes = [];

function preload() {
  // Preload the first image so width/height exist before setup
  if (fileList.length > 0) {
    img = loadImage(fileList[currentImageIndex]);
  }
}

function setup() {
  if (img) {
    createCanvas(Math.floor(scaleFactor * img.width), Math.floor(scaleFactor * img.height));
  } else {
    createCanvas(1200, 700);
  }
}

function draw() {
  background(200);

  if (!img) {
    fill(0);
    textSize(18);
    text("No image found. Make sure 'images/scope1.png' exists in your repo.", 50, 50);
    return;
  }

  // Render scope display
  image(img, 0, 0, scaleFactor * img.width, scaleFactor * img.height);

  // Draw active pulse line (white)
  stroke(255);
  strokeWeight(1);
  if (pulseXs.length > 0) {
    let currentPulseX = pulseXs[pulseXs.length - 1];
    let currentPulseY = pulseYs[pulseYs.length - 1];
    line(xTime0, currentPulseY, currentPulseX, currentPulseY);
  }

  // Draw historical pulse lines (gray)
  stroke(75);
  for (let i = 0; i < pulseXs.length - 1; i++) {
    line(xTime0, pulseYs[i], pulseXs[i], pulseYs[i]);
  }

  // Draw sidebar readout
  noStroke();
  fill(0);
  textSize(18);
  text("Pulse Times", scaleFactor * 800, scaleFactor * 60);
  fill(255, 0, 0);
  text("Remove", scaleFactor * 800 + 100, scaleFactor * 60);

  for (let i = 0; i < pulseXs.length; i++) {
    let pulseTime = (pulseXs[i] - xTime0) / (scaleFactor * 50);
    fill(0);
    text(`${i + 1})`, scaleFactor * 820 - 22, scaleFactor * 60 + (i + 1) * 20);
    text(nf(pulseTime, 0, 2), scaleFactor * 820, scaleFactor * 60 + (i + 1) * 20);

    // Remove buttons
    ellipseMode(CORNER);
    fill(225, 0, 0);
    ellipse(scaleFactor * 800 + 100, scaleFactor * 60 - 14 + (i + 1) * 20, 16, 16);
  }

  // On-screen instructions
  fill(0);
  let textX = scaleFactor * 25;
  let textY = scaleFactor * 500;
  text("Click a pulse to record its time. Use Left/Right arrows to adjust.", textX, textY);
  text("Press 'S' to save pulse times & load next image.", textX, textY + 25);
  text("Press 'Q' to finalize processing and download 'muon_lifetimes.csv'.", textX, textY + 50);

  if (imageProcessingComplete) {
    textSize(48);
    fill(255, 255, 0);
    text("All Images Completed", width / 4, height / 2);
    return;
  }

  // File metadata display
  fill(255);
  textX = scaleFactor * 70;
  textY = scaleFactor * 375;
  text(`#${currentImageIndex + 1} of ${fileList.length}`, textX, textY);
  text(`File: ${fileList[currentImageIndex]}`, textX, textY + 25);
}

function mouseClicked() {
  if (imageProcessingComplete || !img) return;

  let mX = mouseX;
  let mY = mouseY;

  if (settingTime0) {
    xTime0 = mX;
    settingTime0 = false;
  } else if (
    mX >= xTime0 &&
    mX <= scaleFactor * 712.5 &&
    mY >= scaleFactor * 60 &&
    mY <= scaleFactor * 450
  ) {
    pulseXs.push(mX);
    pulseYs.push(mY);
  } else {
    // Remove button detection
    let centerX = scaleFactor * 800 + 108;
    for (let i = 0; i < pulseXs.length; i++) {
      let centerY = scaleFactor * 60 - 6 + (i + 1) * 20;
      let d = dist(mX, mY, centerX, centerY);
      if (d < 8) {
        pulseXs.splice(i, 1);
        pulseYs.splice(i, 1);
        break;
      }
    }
  }
}

function keyPressed() {
  if (!img) return;

  if (keyCode === LEFT_ARROW && pulseXs.length > 0) {
    pulseXs[pulseXs.length - 1] -= 1;
  }
  if (keyCode === RIGHT_ARROW && pulseXs.length > 0) {
    pulseXs[pulseXs.length - 1] += 1;
  }

  if (key === 'S' || key === 's') {
    recordCurrentPulseTimes();
    loadNextImage();
  }

  if (key === 'Q' || key === 'q') {
    recordCurrentPulseTimes();
    saveStrings(savedTimes, 'muon_lifetimes.csv');
    imageProcessingComplete = true;
  }

  if (key === 'C' || key === 'c') {
    settingTime0 = true;
  }
}

function recordCurrentPulseTimes() {
  for (let x of pulseXs) {
    let t = (x - xTime0) / (scaleFactor * 50);
    savedTimes.push(t.toFixed(4));
  }
  pulseXs = [];
  pulseYs = [];
}

function loadNextImage() {
  currentImageIndex++;
  if (currentImageIndex >= fileList.length) {
    imageProcessingComplete = true;
    return;
  }

  loadImage(fileList[currentImageIndex], (loadedImg) => {
    img = loadedImg;
    resizeCanvas(Math.floor(scaleFactor * img.width), Math.floor(scaleFactor * img.height));
  });
}
