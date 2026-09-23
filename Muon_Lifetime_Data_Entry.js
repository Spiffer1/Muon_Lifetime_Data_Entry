/* Muon Lifetime Measurement Tool - GitHub API Subfolder Auto-Discovery
 * Sean Fottrell / p5.js Port
 */

// --- CONFIGURE YOUR GITHUB REPO HERE ---
const repoOwner = "Spiffer1"; // Replace with your GitHub username
const repoName = "Muon_Lifetime_Data_Entry";        // Replace with your repository name

let img;
let fileList = [];  // Holds download URLs from GitHub API
let fileNames = []; // Holds display names
let currentImageIndex = 0;

const scaleFactor = 1.0;
const defaultTime0 = 62.5 * scaleFactor;
let settingTime0 = false;
let imageProcessingComplete = false;

let xTime0 = defaultTime0;
let pulseXs = [];
let pulseYs = [];
let savedTimes = [];

function setup() {
  createCanvas(Math.floor(970 * scaleFactor), Math.floor(560 * scaleFactor));

  // Connect HTML UI Button to GitHub API Fetch
  let loadBtn = select('#loadBtn');
  if (loadBtn) {
    loadBtn.mousePressed(() => {
      let subfolder = select('#folderInput').value().trim();
      if (subfolder.length > 0) {
        fetchGitHubFolder(subfolder);
      }
    });
  }

  // Optionally auto-load a default folder on startup (e.g. "images/run1")
  fetchGitHubFolder("run1");
}

function fetchGitHubFolder(subfolderPath) {
  // Construct GitHub REST API endpoint
  let apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/images/${subfolderPath}`;

  httpGet(apiUrl, 'json', false, (response) => {
    if (!Array.isArray(response)) {
      alert("Invalid folder response from GitHub.");
      return;
    }

    // Filter for PNG files and sort alphabetically by file name
    let pngFiles = response
      .filter(item => item.name.toLowerCase().endsWith('.png'))
      .sort((a, b) => a.name.localeCompare(b.name));

    fileList = [];
    fileNames = [];

    for (let file of pngFiles) {
      fileList.push(file.download_url); // Direct raw URL for p5.loadImage()
      fileNames.push(file.name);
    }

    if (fileList.length > 0) {
      currentImageIndex = 0;
      imageProcessingComplete = false;
      savedTimes = [];
      loadNextImage(currentImageIndex);
    } else {
      alert(`No .png files found in 'images/${subfolderPath}'.`);
    }
  }, (err) => {
    console.error("Error fetching folder from GitHub:", err);
    alert(`Could not find folder 'images/${subfolderPath}' on GitHub.`);
  });
}

function loadNextImage(index) {
  if (index >= fileList.length) {
    recordCurrentPulseTimes();
    exportCSV();
    imageProcessingComplete = true;
    return;
  }

  loadImage(
    fileList[index],
    (loadedImg) => {
      img = loadedImg;
    },
    (err) => {
      console.error(`Failed to load image at: ${fileList[index]}`, err);
    }
  );
}

function draw() {
  background(200);

  if (!img) {
    fill(0);
    noStroke();
    textSize(18);
    textAlign(LEFT, TOP);
    text("Select or enter a valid subfolder above to load oscilloscope images.", 20, 20);
    return;
  }

  // Render scope display
  image(img, 0, 0, scaleFactor * img.width, scaleFactor * img.height);

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

  // --- SIDEBAR & READOUT AREA ---
  noStroke();
  textAlign(LEFT, TOP);
  textSize(16);

  let sidebarX = Math.floor(scaleFactor * 800); 
  let sidebarY = Math.floor(scaleFactor * 40);

  fill(0);
  text("Pulse Times", sidebarX, sidebarY);
  fill(255, 0, 0);
  text("Remove", sidebarX + 100, sidebarY);

  for (let i = 0; i < pulseXs.length; i++) {
    let pulseTime = (pulseXs[i] - xTime0) / (scaleFactor * 50);
    let rowY = sidebarY + 28 + (i * 22);

    fill(0);
    text(`${i + 1})`, sidebarX, rowY);
    text(`${pulseTime.toFixed(2)}`, sidebarX + 30, rowY);

    fill(225, 0, 0);
    ellipseMode(CENTER);
    ellipse(sidebarX + 115, rowY + 8, 14, 14);
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
  text(`File: ${fileNames[currentImageIndex]}`, 20, metaY + 18);

  if (imageProcessingComplete) {
    fill(255, 255, 0);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("All Images Completed - CSV Saved!", width / 2, height / 2);
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
    // Remove Button Hitbox
    let sidebarX = Math.floor(scaleFactor * 800);
    let sidebarY = Math.floor(scaleFactor * 40);

    for (let i = 0; i < pulseXs.length; i++) {
      let buttonX = sidebarX + 115;
      let buttonY = sidebarY + 28 + (i * 22) + 8;
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
  if (!img || imageProcessingComplete) return;

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
    exportCSV();
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

function exportCSV() {
  if (savedTimes.length > 0) {
    saveStrings(savedTimes, 'muon_lifetimes.csv');
  }
}
