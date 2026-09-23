/* Muon Lifetime Measurement Tool - GitHub Pages Baseline Test
 * Debug Version: Uses relative path images inside the repository
 */

let img;
let fileList = [
  "images/scope1.png",  // Add your image relative paths here
  "images/scope2.png",
  "images/scope3.png",
  "images/scope4.png",
  "images/scope5.png"
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
    // Updated Remove Button detection logic
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
