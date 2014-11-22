// Generated by CoffeeScript 1.8.0
(function() {
  var ardrone, swarm, _;

  var face = null;
  var cameraWidth = 640;
  var cameraHeight = 360;
  var cv = require('opencv');

  _ = require("underscore");
  
  ardrone = require("ar-drone");

  swarm = [];

  swarm.drones = {};

  swarm.forEach = function(iterator) {
    return Object.keys(swarm.drones).forEach(function(id) {
      return iterator(swarm.drones[id]);
    });
  };

  swarm["do"] = function(block) {
    return swarm.forEach(function(drone) {
      return typeof block === "function" ? block(drone) : void 0;
    });
  };

  swarm.action = function(command) {
    return swarm.forEach(function(drone) {
      var _name;
      if (drone.enabled) {
        drone.snooze(drone.inactivityTime);
        //console.log("drone[" + command.action + "]()");
        return typeof drone[_name = command.action] === "function" ? drone[_name]() : void 0;
      }
    });
  };

  swarm.move = function(control) {
    return swarm.forEach(function(drone) {
      if (drone.enabled) {
        drone.snooze(drone.inactivityTime);
        return drone.move(control);
      }
    });
  };

  swarm.animate = function(animation) {
    return swarm.forEach(function(drone) {
      if (drone.enabled) {
        drone.snooze(animation.duration);
        return drone.animate(animation.name, animation.duration);
      }
    });
  };

  swarm.png = function() {
    return swarm.forEach(function(drone) {
      if (drone.enabled) {
        console.log('Creating png stream ...');
        var pngStream = drone.getPngStream();
        var lastPng;
        pngStream.on('error', console.log).on('data', function(pngBuffer) {
        	//console.log('Getting png stream ...');
        	lastPng = pngBuffer;    
        	cv.readImage(lastPng, function(err, im) {
           		im.detectObject(cv.FACE_CASCADE, {}, function(err, faces) {
              /***** face save *****
        			for (var i = 0; i < faces.length; i++) {
        				var x = faces[i];
        				im.ellipse(x.x + x.width / 2, x.y + x.height / 2, x.width / 2, x.height / 2);
                console.log("face.x = " + x.x  + ", face.y = " + x.y + ", width = " + x.width + ", height" + x.height);
        			}
              im.save('../out.jpg');              
              **********************/

              // 1 face only
              if(faces.length == 1){
                face = faces[0];
                console.log("face.x = " + face.x  + ", face.y = " + face.y + ", width = " + face.width + ", height" + face.height);
              }else{
                face = null;
              }
        		});
        	})
        });
      }
    });
  }

  swarm.add = function(config) {
    var drone;
    drone = ardrone.createClient({
      ip: config.ip
    });
    drone.id = config.id || config.ip.split(".").pop();
    drone.ip = config.ip;
    drone.enabled = true;
    drone.camera = 1;
    drone.changeCamera = function(camera) {
      if (camera === "toggle") {
        camera = !drone.camera + 0;
      }
      if (typeof camera !== "number") {
        camera = 0;
      }
      drone.config('video:video_channel', '' + camera);
      return drone.camera = camera;
    };
    drone.control = {
      x: 0,
      y: 0,
      z: 0,
      r: 0
    };
    
    drone.isIddle = function() {
      return drone.control.x === 0 && drone.control.y === 0 && drone.control.z === 0 && drone.control.r === 0;
    };
    drone.move = function(control) {
      if (control) {
        _.extend(drone.control, control);
        if (control) {
          //console.log(drone.control, control, drone.isIddle());
        }
      } else {
        control = drone.control;
      }
      if (drone.isIddle()) {
        drone.stop();
      } else {
        // for auto algorhythm
        if(face != null){
          console.log("face detected");
          if(face.y < cameraHeight/2){
            // 0.5 is speed. Speed must be from 0 to 1.
            drone.up(0.5);
            console.log("auto_up");
          }else if(face.y > cameraHeight/2){
            drone.down(0.5);
            console.log("auto_down");
          }
        }
        /********** for oculus control ***********
        if (control.x < 0) {
          drone.left(-control.x);
        } else if (control.x > 0) {
          drone.right(control.x);
        }
        if (control.y < 0) {
          drone.back(-control.y);
        } else if (control.y > 0) {
          drone.front(control.y);
        }
        if (control.z < 0) {
          drone.down(-control.z);
        } else if (control.z > 0) {
          drone.up(control.z);
        }
        if (control.r < 0) {
          drone.counterClockwise(-control.r);
        } else if (control.r > 0) {
          drone.clockwise(control.r);
        }
        ******************************************/
      }
      return control;
    };
    drone.inactivityTime = 200;
    drone.inactivityTimeout = +(new Date) + drone.inactivityTime;
    drone.snooze = function(length) {
      if (drone.inactive) {
        console.log("drone %s snooze (keep alive off)", drone.ip);
      }
      drone.inactive = false;
      return drone.inactivityTimeout = +(new Date) + length;
    };
    drone.keepAlive = function() {
      if (+new Date() > drone.inactivityTimeout) {
        if (!drone.inactive) {
          console.log("drone %s inactive (keep alive on)", drone.ip);
        }
        drone.inactive = true;
        return drone.move();
      }
    };
    setInterval(drone.keepAlive, 30);
    swarm.drones[drone.id] = drone;
    return swarm.push(drone);
  };

  module.exports = swarm;

}).call(this);
