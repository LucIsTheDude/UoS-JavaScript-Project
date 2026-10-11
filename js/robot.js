/*
* This is the JavaScript code for the robot on the HTML5 canvas.
* The robot can walk, spin its arms, and shoot lasers.
* The robot can be powered on and off, and can be charged.
* The robot has a battery level that decreases with each action.
* Written by: Luc Smith
*/

"use strict"; // ensures errors are not ignored and error messages are given

// Functions

function stop() {
  // stop the animation and decrease the power level
  if (requestId) {
    cancelAnimationFrame(requestId);
    robot.walking = false;
    animationInProgress = false; // allow another animation to start
    powerButton.disabled = false; // re-enable the power button
    chargeButton.disabled = false; // re-enable the charge button
    if (powerLevel > 0) {
      powerLevel--;
      draw(robot);
    }
  }
}

function clear() {
  // clear the canvas
  context.clearRect(0, 0, WIDTH, HEIGHT);
}

function draw(robot) {
  // draw a new frame of the robot
  clear();
  robot.draw();
}

function updateWalk(robot, move) {
  if (move.direction == "right")
    // move the robot right or left depending on the direction
    robot.x++;
  else robot.x--;

  robot.frameCount++;
  if (robot.frameCount == 30) {
    // change the walking frame of the robot every 30 frames
    robot.frameCount = 0;
    robot.frame = (robot.frame + 1) % 2; // alternate between 0 and 1
  }
}

function nextFrameWalk(robot, move) {
  requestId = requestAnimationFrame(function() {
    nextFrameWalk(robot, move)
  }); // request the next frame
  updateWalk(robot, move); // update the robot's position and frame if needed
  draw(robot); // re-draw the robot with the updated properties
  if (move.direction == "right") {
    // stop the animation if the robot reaches the destination
    if (robot.x >= move.end) stop();
  } else if (robot.x <= move.end) stop();
}

function walkToMouse(robot, move) {
  robot.walking = true;
  robot.frameCount = 0;
  draw(robot);
  nextFrameWalk(robot, move);
}

function drawArmSpin(robot, arm) {
  // draw a new frame of the robot with the arm spinning
  clear();
  robot.drawArmSpin(arm);
}

function updateArm(robot, arm) {
  // update the arm angle depending on the arm being spun
  (arm == "left") ? robot.armAngle -= 0.05 : robot.armAngle += 0.05;
}

function nextFrameArm(robot, arm) {
  requestId = requestAnimationFrame(function() {
    nextFrameArm(robot, arm);
  }); // request the next frame
  updateArm(robot, arm); // update the arm angle
  drawArmSpin(robot, arm); // re-draw the robot with the updated arm
  if (robot.armAngle >= 8 * Math.PI || robot.armAngle <= -8 * Math.PI) {
    // stop the animation if the arm has spun 4 times
    stop();
    robot.armAngle = 0; // reset the arm angle
    draw(robot);
  }
}

function spinArm(robot, direction) {
  drawArmSpin(robot, direction);
  nextFrameArm(robot, direction);
}

function drawLaser(robot, lasers) {
  // draw the laser beam
  clear();
  robot.draw();

  context.beginPath();
  context.ellipse(lasers.x[0] + lasers.dx, lasers.y + lasers.dy,
                  4, 4, 0, 0, 2 * Math.PI);
  context.fill();
  context.moveTo(lasers.x[0], lasers.y);
  context.lineTo(lasers.x[0] + lasers.dx, lasers.y + lasers.dy);
  context.moveTo(lasers.x[1], lasers.y);
  context.lineTo(lasers.x[0] + lasers.dx, lasers.y + lasers.dy);
  context.strokeStyle = "red";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.stroke();
  
  setTimeout(function() {
    clear();
    robot.draw();
    animationInProgress = false; // allow another animation to start
    powerButton.disabled = false; // re-enable the power button
    if (powerLevel > 0) {
      powerLevel--;
      draw(robot);
    }
  }, 1000); // wait 1 second before making the laser disappear
}

function laserToMouse(robot, mx, my) {
  let part = robot.parts[4]; // head
  let x = robot.x + part.dx;
  let y = part.y + 32;

  let lasers = {
    x: [x + 6, x + part.width - 6],
    y: y,
    dx: mx - x,
    dy: my - y
  }; // object literal containing the laser coordinates and direction
  
  drawLaser(robot, lasers);
}

function animateCharge(robot) {
  // animate the robot charging for 3 seconds
  animationInProgress = true;
  let part = robot.parts[4]; // head
  context.drawImage(robot.images[11], robot.x - 74, 0,
                    part.width * 5, HEIGHT - part.y - 10);
  setTimeout(function() {
    powerLevel = 3;
    draw(robot);
    animationInProgress = false;
    powerButton.disabled = false;
    if (!state) powerButton.style.backgroundColor = "limegreen";
  }, 3000); // wait 3 seconds before finishing charging
}

function getMouseXY(evt) {
  // gets information about the canvas position relative to the viewport
  let boundingRect = canvas.getBoundingClientRect();

  // finds the offset of the canvas from the left and top of the viewport
  let offsetX = boundingRect.left;
  let offsetY = boundingRect.top;

  // finds the scale factors for the canvas relative to the viewport
  let scaleX = canvas.width / boundingRect.width;
  let scaleY = canvas.height / boundingRect.height;

  // finds the mouse position relative to the canvas
  let mx = Math.round((evt.clientX - offsetX) * scaleX);
  let my = Math.round((evt.clientY - offsetY) * scaleY);
  return {x: mx, y: my};
}

function armClicked(arm, robotX, x, y) {
  let armStartX = robotX + arm.dx;
  let armEndX = armStartX + arm.width;
  let armStartY = arm.y;
  let armEndY = armStartY + arm.height;
  return (x >= armStartX && x <= armEndX) && (y >= armStartY && y <= armEndY);
}

function action(evt, robot) {
  if (animationInProgress || powerLevel == 0 || !state) return;
  animationInProgress = true; // prevent multiple animations at once
  powerButton.disabled = true; // disable the power button while animating
  chargeButton.disabled = true; // disable the charge button while animating

  let mouseXY = getMouseXY(evt);
  let mx = mouseXY.x
  let my = mouseXY.y
  
  let robotX = robot.x;
  let leftArm = robot.parts[5]; // left arm
  let rightArm = robot.parts[6]; // right arm

  if ( my >= HEIGHT - 72 ) {
    let d = mx > robot.x ? "right" : "left"; // direction of movement
    let move = {start: robot.x, end: mx, direction: d};
    walkToMouse(robot, move);
  }
  else if (armClicked(leftArm, robotX, mx, my)) {
    spinArm(robot, "left");
  }
  else if (armClicked(rightArm, robotX, mx, my)) {
    spinArm(robot, "right");
  } 
  else laserToMouse(robot, mx, my);
}

function loadImages(filenames, callback) {
  // load all the images into the images array and call the callback function
  let images = new Array(filenames.length);
  let imageCount = 0;
  for (let i=0; i<filenames.length; i++) {
    images[i] = new Image();
    images[i].onload = function() {
      imageCount++; 
      if (imageCount == filenames.length) callback(images);
    };
    images[i].src = filenames[i];
  }
}

function initAndStart(robot) {
  // load all the images for the robot parts and draw the robot
  let partFiles = ["images/leg.png", "images/body.png", "images/battery-3.png",
                   "images/head.png", "images/powered-up.png",
                   "images/left-arm.png", "images/right-arm.png",
                   "images/powered-down.png", "images/battery-2.png",
                   "images/battery-1.png", "images/battery-0.png",
                   "images/lightning.png"];
  loadImages(partFiles, function(images) {
    robot.images = images;
    robot.draw();
  });
}



// Main program

// global variables and constants
let canvas = document.getElementById("my_canvas");
let context = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
let requestId; // for animation
let animationInProgress = false; // to prevent multiple animations at once
let powerLevel = 3; // battery level of the robot
let state = false; // power state of the robot (on or off)

// object literal containing information about the robot
let robot = {
  x: WIDTH / 2, // what x-coordinate the robot is at
  armAngle: 0,

  walking: false,
  frame: 0,
  frameCount: 0,

  images: [], // array of the loaded images for the robot parts
  parts: [
    {dx: [-27, 3], y: HEIGHT - 72, width: 22, height: 72}, // 0 Leg
    {dx: -32, y: HEIGHT - 153, width: 62, height: 82},     // 1 Body
    {dx: -13, y: HEIGHT - 141, width: 24, height: 58},     // 2 Battery
    {dx: -28, y: HEIGHT - 198, width: 53, height: 46},     // 3 Head
    {dx: -16, y: HEIGHT - 209, width: 29, height: 38},     // 4 Eyes & Indicator
    {dx: -53, y: HEIGHT - 153, width: 22, height: 77},     // 5 Left Arm
    {dx: 29, y: HEIGHT - 153, width: 22, height: 77}       // 6 Right Arm
  ], // array of the robot parts and their respective positions on the canvas

  moveArms: function(part, i) {
    // move arms depending on walk frame
    if (this.frame == 0 && i == 5)
      context.drawImage(this.images[i], this.x + part.dx, part.y,
                        part.width, part.height - 10);
    else if (this.frame == 1 && i == 6)
      context.drawImage(this.images[i], this.x + part.dx, part.y,
                        part.width, part.height - 10);
    else context.drawImage(this.images[i], this.x + part.dx, part.y, 
                           part.width, part.height);
  },

  drawBatteryLevel: function(part) {
    // draw the correct battery level on the robot
    context.drawImage(this.images[10 - powerLevel], this.x + part.dx, part.y,
                      part.width, part.height);
    if (powerLevel < 3 && !animationInProgress) chargeButton.disabled = false;
    if (powerLevel == 0) {
      // if the battery is depleted, power off the robot
      state = false;
      powerButton.innerHTML = "Power On";
      powerButton.className = "powerOn";
      powerButton.disabled = true;
    }
  },

  drawLegs: function() {
    // draw the legs of the robot, and alternate the frame for walking if needed
    let part = this.parts[0];
    if (this.walking) {
      if (this.frame == 0) {
        context.drawImage(this.images[0], this.x + part.dx[0], part.y, 
                          part.width, part.height);
        context.drawImage(this.images[0], this.x + part.dx[1], part.y, 
                          part.width, part.height - 10);
      } else {
        context.drawImage(this.images[0], this.x + part.dx[0], part.y, 
                          part.width, part.height - 10);
        context.drawImage(this.images[0], this.x + part.dx[1], part.y, 
                          part.width, part.height);
      }
    } else for (let i=0; i<=1; i++)
      context.drawImage(this.images[0], this.x + part.dx[i], part.y, 
                        part.width, part.height);
  },

  draw: function() {
    // the main draw function for the robot
    let part;
    
    this.drawLegs(); // draw the legs first

    // draw the rest of the robot parts
    for (let i=1; i<this.parts.length; i++) {
      part = this.parts[i];
      if (i == 2 && powerLevel != 3) this.drawBatteryLevel(part);
      else if (i == 4 && (powerLevel == 0 || !state)) {
        // draw the robot powered-down if it is off or the battery is depleted
        context.drawImage(this.images[7], this.x + part.dx, part.y,
                          part.width, part.height);
      } else {
        if (this.walking && (i == 5 || i == 6)) {
          // move arms if the robot is walking
          this.moveArms(part, i);
        } else context.drawImage(this.images[i], this.x + part.dx, part.y, 
                                 part.width, part.height);
      }
    }
  },

  drawArmSpin: function(arm) {
    // draw the robot with either arm spinning
    let armIndex = (arm == "left") ? 5 : 6; // 5 if left, 6 if right
    let part;

    this.drawLegs(); // draw the legs first

    // draw the rest of the robot parts
    for (let i=1; i<this.parts.length; i++) {
      part = this.parts[i];
      if (i == 2 && powerLevel != 3) this.drawBatteryLevel(part);
      else if (i == 4 && (powerLevel == 0 || !state)) {
        // draw the robot powered-down if it is off or the battery is depleted
        context.drawImage(this.images[7], this.x + part.dx, part.y,
                          part.width, part.height);
      } else {
        if (arm == "left" && i == 6) continue; // skip right arm

        // draw the rotating arm
        if (i == armIndex) {
          context.save();
          if (arm == "left") {
            // draw the right arm first to prevent overlap
            part = this.parts[6];
            context.drawImage(this.images[6], this.x + part.dx, part.y,
                              part.width, part.height);
            part = this.parts[armIndex];

            // rotate around the top right corner of the arm image
            context.translate(this.x + part.dx + part.width, part.y);
            context.rotate(this.armAngle);
            context.drawImage(this.images[i], -part.width, 0, part.width,
                              part.height);
          } else {
            // rotate around the top left corner of the arm image
            context.translate(this.x + part.dx, part.y);
            context.rotate(this.armAngle);
            context.drawImage(this.images[i], 0, 0, part.width, part.height);
          }
          context.restore();
        } else context.drawImage(this.images[i], this.x + part.dx, part.y, 
                                part.width, part.height);
      }
    }
  }
};

// start

initAndStart(robot); // load all the images into memory and draw the robot

// if the canvas is clicked, perform an action (if the robot is powered on)
canvas.addEventListener('click', function(event) { action(event, robot); });

let powerButton = document.getElementById("power_button");
powerButton.addEventListener('click', function() {
  // if the power button is clicked, chanage the state and adjust the button
  if (state) {
    state = false;
    powerButton.innerHTML = "Power On";
    powerButton.style.backgroundColor = "limegreen";
    powerButton.className = "powerOn";
    draw(robot);
  } else {
    state = true;
    powerButton.innerHTML = "Power Off";
    powerButton.style.backgroundColor = "red";
    powerButton.className = "powerOff";
    draw(robot);
  }
});

let chargeButton = document.getElementById("charge_button");
chargeButton.disabled = true; // initially disabled
chargeButton.addEventListener('click', function() {
  // if the charge button is clicked, animate the robot charging for 3 seconds
  chargeButton.disabled = true;
  powerButton.disabled = true;
  animateCharge(robot);
});
