/* Muon Lifetime Measurement Tool - GitHub Pages Fix
 * Explicit sizing and asynchronous image loading
 */

let img;
let fileList = [
  "images/scope1.png",  // Replace with your actual repo relative paths
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

function setup() {
  // 1. Create canvas with standard fallback dimensions immediately
  createCanvas(Math.floor(970 * scaleFactor), Math.floor(560 * scaleFactor));
  
  // 2. Load first image explicitly
  if (fileList.length > 0) {
    loadNextImage(currentImageIndex);
  }
}

function draw() {
  background(200);

  if (!img) {
    fill(0);
    noStroke();
    textSize(18);
    textAlign(LEFT, TOP);
    text("Loading image or image not found...", 20, 20);
    text(`Path: ${fileList[currentImageIndex]}`, 20, 50);
    return;
  }

  // 3. Render scope display using actual loaded image dimensions or scale
  let renderW = img.width > 0 ? img.width * scaleFactor : width;
  let renderH = img.height > 0 ? img.height * scaleFactor : height;
  image(img, 0, 0, renderW, renderH);

  // Active pulse line (white)
  stroke(255);
  strokeWeight(1);
  if (pulseXs.length > 0) {
    let currentPulseX = pulseXs[pulseXs.length - 1];
    let currentPulseY = pulseYs[pulseYs.length - 1];
    line(xTime0, currentPulseY, currentPulseX, currentPulseY);
  }

  // Historical pulse lines (gray)
  stroke(75);
  for (let i = 0; i < pulseXs.length - 1; i++) {
    line(xTime0, pulseYs[i], pulseXs[i], pulseYs[i]);
  }

  // Sidebar & Readout Area
  noStroke();
  textAlign(LEFT, TOP);
  textSize(16);

  let sidebarX = Math.floor(scaleFactor * 750);
  let sidebarY = 20;

  fill(0);
  text("Pulse Times", sidebarX, sidebarY);
  fill(255, 0, 0);
  text("Remove", sidebarX + 110, sidebarY);

  for (let i = 0; i < pulseXs.length; i++) {
    let pulseTime = (pulseXs[i] - xTime0) / (scaleFactor * 50);
    let rowY = sidebarY + 30 + (i * 24);

    fill(0);
    text(`${i + 1})`, sidebarX, rowY);
    text(`${pulseTime.toFixed(2)}`, sidebarX + 30, rowY);

    fill(225, 0, 0);
    ellipseMode(CENTER);
    ellipse(sidebarX + 130, rowY + 8, 14, 14);
  }

  // Bottom Instructions Banner
  fill(0);
  textSize(14);
  let bottomY = height - 80;

  text("• Click a pulse to record its time. Use Left/Right arrows to adjust.", 20, bottomY);
  text("• Press 'S' to save pulse times & load next image.", 20, bottomY + 20);
  text("• Press 'Q' to finalize processing and download 'muon_lifetimes.csv'.", 20, bottomY + 40);

  // File Metadata Display
  fill(255);
  textSize(14);
  let metaY = height - 130;
  text(`#${currentImageIndex + 1} of ${fileList.length}`, 20, metaY);
  text(`File: ${fileList[currentImageIndex]}`, 20, metaY + 18);

  if (imageProcessingComplete) {
    fill(255, 255, 0);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("All Images Completed", width / 2, height / 2);
  }
}

function loadNextImage(index) {
  if (index >= fileList.length) {
    imageProcessingComplete = true;
    return;
  }

  loadImage(
    fileList[index],
    (loadedImg) => {
      img = loadedImg;
      // Dynamically resize canvas to fit scaled image dimensions once loaded
      resizeCanvas(
        Math.floor(scaleFactor * img.width),
        Math.floor(scaleFactor * img.height)
      );
    },
    (err) => {
      console.error(`Failed to load image at: ${fileList[index]}`, err);
    }
  );
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
    let sidebarX = Math.floor(scaleFactor * 750);
    let sidebarY = 20;

    for (let i = 0; i < pulseXs.length; i++) {
      let buttonX = sidebarX + 130;
      let buttonY = sidebarY + 38 + (i * 24);
      let d = dist(mX, mY, buttonX, buttonY);

      if (d < 10) {
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
    currentImageIndex++;
    loadNextImage(currentImageIndex);
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
