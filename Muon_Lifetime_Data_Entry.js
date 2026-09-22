/* Muon Lifetime Measurement Tool - p5.js Version
 * Original by Sean Fottrell
 * Ported for Browser Execution with Google Drive support
 */

let img;
let fileList = []; // Array of URL strings or File objects
let currentImageNumber = 0;

const scaleFactor = 2.0;
const defaultTime0 = 62.5 * scaleFactor;
let settingTime0 = false;
let doneSettingUp = false;
let imageProcessingComplete = false;

let xTime0 = defaultTime0;
let pulseXs = [];
let pulseYs = [];
let savedTimes = []; // Holds lifetime data for CSV export

// DOM UI elements
let urlTextArea, loadUrlsButton, localFileInput;

function setup() {
  createCanvas(floor(970 * scaleFactor), floor(560 * scaleFactor));

  // --- UI Controls for File Import ---
  createP('<b>Option 1: Paste Google Drive Image Links (one per line)</b>').position(10, height + 10);
  urlTextArea = createTextArea('');
  urlTextArea.position(10, height + 40);
  urlTextArea.size(500, 80);
  
  loadUrlsButton = createButton('Load Google Drive Images');
  loadUrlsButton.position(520, height + 40);
  loadUrlsButton.mousePressed(parseGoogleDriveUrls);

  createP('<b>Option 2: Select Local .png Files</b>').position(10, height + 130);
  localFileInput = createFileInput(handleLocalFiles, true); // Multiple files enabled
  localFileInput.position(10, height + 160);
}

function draw() {
  background(200);

  if (!doneSettingUp) {
    fill(50);
    textSize(18);
    text("Load images via Google Drive links or the file picker below to start.", 20, 40);
    return;
  }

  if (img) {
    image(img, 0, 0, scaleFactor * img.width, scaleFactor * img.height);
  }

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
  text(`#${currentImageNumber} of ${fileList.length}`, textX, textY);

  let item = fileList[currentImageNumber - 1];
  let fileName = typeof item === 'string' ? `Drive Image ${currentImageNumber}` : item.name;
  text(`File: ${fileName}`, textX, textY + 25);
}

function mouseClicked() {
  if (!doneSettingUp || imageProcessingComplete) return;

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
    // Check click alignment with "Remove" buttons
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
  if (!doneSettingUp) return;

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
    exportCSV();
    imageProcessingComplete = true;
  }

  if (key === 'C' || key === 'c') {
    settingTime0 = true;
  }
}

// Store current image times into master array
function recordCurrentPulseTimes() {
  for (let x of pulseXs) {
    let t = (x - xTime0) / (scaleFactor * 50);
    savedTimes.push(t.toFixed(4));
  }
  pulseXs = [];
  pulseYs = [];
}

// Download final CSV output
function exportCSV() {
  saveStrings(savedTimes, 'muon_lifetimes.csv');
}

// Sequentially load image assets
function loadNextImage() {
  if (currentImageNumber >= fileList.length) {
    imageProcessingComplete = true;
    return;
  }

  let source = fileList[currentImageNumber];
  let srcUrl = typeof source === 'string' ? source : source.data;

  loadImage(srcUrl, (loadedImg) => {
    img = loadedImg;
    currentImageNumber++;
  });
}

// Parse direct Google Drive links
function parseGoogleDriveUrls() {
  let lines = urlTextArea.value().split('\n');
  fileList = [];

  for (let line of lines) {
    let clean = line.trim();
    if (clean.length > 0) {
      let fileId = extractDriveId(clean);
      if (fileId) {
        fileList.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
      }
    }
  }

  if (fileList.length > 0) {
    currentImageNumber = 0;
    doneSettingUp = true;
    imageProcessingComplete = false;
    loadNextImage();
  } else {
    alert('No valid Google Drive URLs found.');
  }
}

function extractDriveId(url) {
  let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Handle multi-file local upload fallback
function handleLocalFiles(file) {
  if (file.type === 'image') {
    fileList.push(file);
    if (!doneSettingUp) {
      currentImageNumber = 0;
      doneSettingUp = true;
      loadNextImage();
    }
  }
}