










/*jshint laxcomma: true, laxbreak: true, browser: true */
(function() {
    "use strict";

    var opts = {
        tilt: 40,
        turn: 20,
        fpr: 128
    };


    var frame_count = 10000;
    var gCanvas, gCtx;
    var gImage, gCtxImg;


    var size;

    var canvasImageData, textureImageData;


    var fpr = 800;


    var X = 0,
        Y = 1,
        Z = 2;


    var v, h;

    var textureWidth, textureHeight;

    var hs = 30; // Horizontal scale of viewing area
    var vs = 30; // Vertical scale of viewing area



    var F = [0, 0, 0]; // Focal point of viewer
    var S = [0, 30, 0]; // Centre of sphere/planet

    var r = 12; // Radius of sphere/planet


    var f = 30;




    var RX = 0,
        RY, RZ;

    var rx, ry, rz;

    var a;
    var b;
    var b2; // b squared
    var bx = F[X] - S[X]; // = 0 for current values of F and S
    var by = F[Y] - S[Y];
    var bz = F[Z] - S[Z]; // = 0 for current values of F and S



    var c = F[X] * F[X] + S[X] * S[X] + F[Y] * F[Y] + S[Y] * S[Y] + F[Z] * F[Z] + S[Z] * S[Z] - 2 * (F[X] * S[X] + F[Y] * S[Y] + F[Z] * S[Z]) - r * r;

    var c4 = c * 4; // save a bit of time maybe during rendering

    var s;

    var m1 = 0;




    var hs_ch; // horizontal scale divided by canvas width
    var vs_cv; // vertical scale divided by canvas height
    var hhs = 0.5 * hs; // half horizontal scale
    var hvs = 0.5 * vs; // half vertical scale

    var V = new Array(3); // vector for storing direction of each pixel from F
    var L = new Array(3); // Location vector from S that pixel 'hits' sphere

    var VY2 = f * f; // V[Y] ^2  NB May change if F changes


    var rotCache = {};

    function calcL(lx, ly, rz) {


        var key = "" + lx + "," + ly + "," + rx;
        if (rotCache[key] == null) {
            rotCache[key] = 1;
        } else {
            rotCache[key] = rotCache[key] + 1;
        }
    }


    var calculateVector = function(h, v) {

        V[X] = (hs_ch * h) - hhs;
        V[Z] = (vs_cv * v) - hvs;
        a = V[X] * V[X] + VY2 + V[Z] * V[Z];
        s = (b2 - a * c4); // the square root term

        if (s > 0) {

            m1 = ((-b) - (Math.sqrt(s))) / (2 * a);

            L[X] = m1 * V[X]; //    bx+m1*V[X];
            L[Y] = by + (m1 * V[Y]);
            L[Z] = m1 * V[Z]; //    bz+m1*V[Z];



            var lx = L[X];
            var srz = Math.sin(rz);
            var crz = Math.cos(rz);
            L[X] = lx * crz - L[Y] * srz;
            L[Y] = lx * srz + L[Y] * crz;



            var lz;
            lz = L[Z];
            var sry = Math.sin(ry);
            var cry = Math.cos(ry);
            L[Z] = lz * cry - L[Y] * sry;
            L[Y] = lz * sry + L[Y] * cry;




            var lh = textureWidth + textureWidth * (Math.atan2(L[Y], L[X]) + Math.PI) / (2 * Math.PI);



            var lv = textureWidth * Math.floor(textureHeight - 1 - (textureHeight * (Math.acos(L[Z] / r) / Math.PI) % textureHeight));
            return {
                lv: lv,
                lh: lh
            };
        }
        return null;
    };


    /**
     * Create the sphere function opject
     */
    var sphere = function() {
		var posX,
			posY;
			
        var textureData = 0;//textureImageData.data;
        var canvasData = 0;//canvasImageData.data;

        var copyFnc;

        if (canvasData.splice) {

            copyFnc = function(idxC, idxT) {
                canvasData.splice(idxC, 4, textureData[idxT + 0], textureData[idxT + 1], textureData[idxT + 2], 255);
            };
        } else {
            copyFnc = function(idxC, idxT) {
                canvasData[idxC + 0] = textureData[idxT + 0];
                canvasData[idxC + 1] = textureData[idxT + 1];
                canvasData[idxC + 2] = textureData[idxT + 2];
                canvasData[idxC + 3] = 255;
            };
        }

        var getVector = (function() {
            var cache = new Array(size * size);
            return function(pixel) {
                if (cache[pixel] === undefined) {
                    var v = Math.floor(pixel / size);
                    var h = pixel - v * size;
                    cache[pixel] = calculateVector(h, v);
                }
                return cache[pixel];
            };
        })();

        var posDelta = textureWidth / (20 * 1000);
        var firstFramePos = (new Date()) * posDelta;

        var stats = {
            fastCount: 0,
            fastSumMs: 0
        };

        return {

            renderFrame: function(time) {
                this.RF(time);
                return;
                stats.firstMs = new Date() - time;
                this.renderFrame = this.sumRF;
                console.log(rotCache);
                for (var key in rotCache) {
                    if (rotCache[key] > 1) {
                        console.log(rotCache[key]);
                    }
                }
            },
            sumRF: function(time) {
                this.RF(time);
                stats.fastSumMs += new Date() - time;
                stats.fastCount++;
                if (stats.fastSumMs > stats.firstMs) {

                    this.renderFrame = this.RF;
                }
            },



            RF: function(time) {

                rx = RX * Math.PI / 180;
                ry = RY * Math.PI / 180;
                rz = RZ * Math.PI / 180;

                var turnBy = 24 * 60 * 60 + firstFramePos - time * posDelta;
                var pixel = size * size;

				
				var left,
					top;
					
				
				left = this.posX - size/2;
				top = this.posY - size/2;
					
				
				
				
				gCtx.beginPath();
				gCtx.arc(this.posX, this.posY, 150, 0, 2 * Math.PI, false);
				gCtx.save();
				gCtx.clip();
				
				gCtx.clearRect(left, top, 400, 400);
				gCtx.restore();
				
				
				// Create gradient
				grd = gCtx.createLinearGradient(left, top, left + 500, top + 500);
				//grd = gCtx.createLinearGradient(left, top, left + 600, top + 600);

				// Add colors
				grd.addColorStop(0.000, 'rgba(0, 0, 255, 0.4)');
				grd.addColorStop(1.000, 'rgba(0, 0, 0, 0.000)');

				// Fill with gradient
				
				
				//gCtx.beginPath();
				//gCtx.moveTo(left + 300, top + 55);
				
				//gCtx.lineTo(left + 600, top + 350);
				
				//gCtx.lineTo(left + 450, top + 500);
				
				//gCtx.lineTo(left + 150, top + 365);
				
				//gCtx.fillStyle = grd;
				
				//gCtx.fill();
				
				//gCtx.strokeStyle = '#49cef4';
				//gCtx.strokeStyle = 'magenta';
				//gCtx.stroke();
				
				
				//console.log(this);
				
				//console.log(posX);
				//gCtx.imageSmoothingEnabled = true;
				
				
				
				
				
				
				
				
				
				
				//gCtx.clearRect(0, 0, 1920, 1080);
				//consle.log(canvasImageData);
				
                //gCtx.putImageData(canvasImageData, this.posX - size/2, this.posY - size/2);
                //gCtx.putImageData(canvasImageData, this.posX - size/2, this.posY - size/2 - 100);
				
				
				// outside glow
				var grd = gCtx.createRadialGradient(this.posX, this.posY, 0, this.posX, this.posY, 250);
      
				  // Add colors
				grd.addColorStop(0.0, 'rgba(58, 165, 235, 0.0)');
				
				
				grd.addColorStop(0.880, "rgba(58, 165, 235, " + ((((Math.cos(time / 500) + 1.0) / 2.0) * 0.137) + 0.05) + ")");//0.167)');
				grd.addColorStop(1.000, 'rgba(0, 0, 0, 0.000)');
				
				// Fill with gradient
				gCtx.fillStyle = grd;
				gCtx.fillRect(0, 0, 2000, 2000);
				
				
				// Create gradient
				
				gCtx.beginPath();
				gCtx.arc(this.posX, this.posY, 225, 0, 2 * Math.PI, false);
				grd = gCtx.createLinearGradient(left, top, left + 300, top + 300);
				//grd = gCtx.createLinearGradient(left, top, left + 600, top + 600);

				// Add colors
				grd.addColorStop(0.000, 'rgba(255, 255, 255, 1.0)');
				grd.addColorStop(1.000, 'rgba(0, 0, 0, 0.000)');
				
				gCtx.lineWidth = 2;
				gCtx.strokeStyle = grd;
				
				gCtx.stroke();
				
				
				
				gCtx.beginPath();
				gCtx.arc(this.posX, this.posY, 150, 0, 2 * Math.PI, false);
				gCtx.save();
				gCtx.clip();
				
				
				
				gCtx.beginPath();
				top += 18;
				gCtx.moveTo(left + 236, top + 12);
				gCtx.bezierCurveTo(left + 236, top + 12, left + 300, top + 230, left + 81, top + 310);
				
				gCtx.bezierCurveTo(left + 81, top + 310, left + 190, top + 410, left + 315, top + 315);
				
				gCtx.bezierCurveTo(left + 315, top + 315, left + 400, top + 260, left + 365, top + 120);
				
				gCtx.bezierCurveTo(left + 365, top + 120, left + 320, top + 15, left + 236, top + 12);
				
				gCtx.fillStyle  = 'rgba(0, 0, 200, 0.2)';
				
				
				gCtx.fill();
				
				
				gCtx.restore();
				gCtx.strokeStyle = 'red';
				//gCtx.stroke();
				
				
				
				gCtx.beginPath();
				gCtx.arc(this.posX, this.posY, size/2 - 53, 0, 2 * Math.PI, false);
				gCtx.lineWidth = 8;
				gCtx.strokeStyle = '#49cef4';
				//gCtx.strokeStyle = 'magenta';
				gCtx.stroke();
            }
        };
    };

    function copyImageToBuffer(aImg) {
        gImage = document.createElement('canvas');
        textureWidth = aImg.naturalWidth;
        textureHeight = aImg.naturalHeight;
        gImage.width = textureWidth;
        gImage.height = textureHeight;

        gCtxImg = gImage.getContext("2d");
        //gCtxImg.clearRect(0, 0, textureHeight, textureWidth);
        //gCtxImg.drawImage(aImg, 0, 0);
       // textureImageData = gCtxImg.getImageData(0, 0, textureHeight, textureWidth);

        hs_ch = (hs / size);
        vs_cv = (vs / size);
    }

	
	var earthPrime = undefined;
	
    this.createSphere = function(gCanvas, textureUrl, realPosX, realPosY) {
        size = Math.min(gCanvas.width, gCanvas.height);
		size = 400;
        gCtx = gCanvas.getContext("2d");
        canvasImageData = gCtx.createImageData(size, size);

        ry = 90 + opts.tilt;
        rz = 180 + opts.turn;

        RY = (90 - ry);
        RZ = (180 - rz);

        hs_ch = (hs / size);
        vs_cv = (vs / size);

        V[Y] = f;

        b = (2 * (-f * V[Y]));
        b2 = Math.pow(b, 2);

        var img = new Image();
        img.onload = function() {
            copyImageToBuffer(img);
            var earth = sphere();
			
			earth.posX = realPosX;
			earth.posY = realPosY;
			
            var renderAnimationFrame = function( /* time */ time) {
                /* time ~= +new Date // the unix time */
                earth.renderFrame(time);
                window.requestAnimationFrame(renderAnimationFrame);
            };

			window.earthPrime = earth;

            /*
            function renderFrame(){
              earth.renderFrame(new Date);
            }
            setInterval(renderFrame, 0);
            */

           
            //(function loop(){  
            //  setTimeout(function(){  
              //  loop();
            //  }, 0);
            //})();

            //window.requestAnimationFrame(renderAnimationFrame);

        };
        img.setAttribute("src", textureUrl);
    };
	
	
}).call(this);















// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};


function rand(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

var can = null;
var con = null;
var starLightSource = new Object();

var stars = new Array();

function drawStar(cx,cy,spikes,outerRadius,innerRadius, alpha)
{
  var rot=Math.PI/2*3;
  var x=cx;
  var y=cy;
  var step=Math.PI/spikes;

  con.beginPath();
  
  rot += Math.radians(35.0);
  //con.moveTo(cx,cy-outerRadius)
  //rot += Math.PI;
  for(var i=0;i<spikes;i++){
	x=cx+Math.cos(rot)*outerRadius;
	y=cy+Math.sin(rot)*outerRadius;
	con.lineTo(x,y)
	rot+=step

	x=cx+Math.cos(rot)*innerRadius;
	y=cy+Math.sin(rot)*innerRadius;
	con.lineTo(x,y)
	rot+=step
  }
  //con.lineTo(cx,cy-outerRadius);
  con.closePath();
  con.lineWidth=0;
  con.strokeStyle='none';
  //con.stroke();
  con.fillStyle="rgba(255, 255, 255, " + alpha + ")";
  con.fill();
}

$(document).ready(function()
{
	var width = $(window).width(),
		height = $(window).height();
		
			
	can = $("<canvas width=\"1920\" height=\"1080\"></canvas>")[0];
	con = can.getContext("2d");
	
	$("#wallpaper").append(can);
	
	
	starLightSource.x = rand(10, width - 10);
	starLightSource.y = rand(10, height - 10);
	starLightSource.direction = new Object();
	starLightSource.direction.x = (rand(0, 1) == 1 ? 1 : -1);
	starLightSource.direction.y = (rand(0, 1) == 1 ? 1 : -1);
	starLightSource.speed = 50;
	
	for(var i = 0; i < 300; i++)
	{
		star = new Object();
		star.x = rand(-width/2, width * 1.5);
		star.y = rand(-width/2, height * 1.5);
		star.size = (rand(0, 3) == 0 ? 4.0 : 2.0);
		
		stars.push(star);
	}
	
	var texture = "img/earth.png";
	
	
	createSphere(can,texture, width/2, height/2);
	
	var globalOffsetX,
	globalOffsetY;
	
	$(window).resize(function(e)
	{		
		//alert($(window).width());
		console.log($(window).width());
		
		can.width = $(window).width();
		can.height = $(window).height();
		
		width = $(window).width(),
		height = $(window).height();
		
		window.earthPrime.posX = $(window).width()/2;
		window.earthPrime.posY = $(window).height()/2;
		
		stars = new Array();
		
		for(var i = 0; i < 300; i++)
		{
			star = new Object();
			star.x = rand(-width/2, width * 1.5);
			star.y = rand(-width/2, height * 1.5);
			star.size = (rand(0, 3) == 0 ? 4.0 : 2.0);
			
			stars.push(star);
		}
	});
	
	$(document).mousemove(function(e)
	{
		globalOffsetX = e.clientX - $(document).width()/2;
		globalOffsetY = e.clientY - $(document).height()/2;
		
		
		//starLightSource.x = e.clientX;
		//starLightSource.y = e.clientY;
	});
	
	
	setInterval(function(){
		
		// Move the star light source
		if(starLightSource.x - starLightSource.speed <= 0.0)
			starLightSource.direction.x *= -1.0;
		
		if(starLightSource.y - starLightSource.speed <= 0.0)
			starLightSource.direction.y *= -1.0;
		
		if(starLightSource.x + starLightSource.speed >= width)
			starLightSource.direction.x *= -1.0;
		
		if(starLightSource.y + starLightSource.speed >= height)
			starLightSource.direction.y *= -1.0;
		
		starLightSource.x += starLightSource.direction.x * starLightSource.speed;
		starLightSource.y += starLightSource.direction.y * starLightSource.speed;
		
		
		
		
		
		
		// save the context
		con.save();
		
		
		// ------------------- background -------------------
		con.fillStyle = "#0a4278";
		con.fillRect(0, 0, width, height);
		
		 // Create gradient
		grd = con.createRadialGradient(0.000, 0.000, 0.000, 90.000, 90.000, width * 1.10);

		// Add colors
		grd.addColorStop(0.100, 'rgba(10, 66, 120, 0.000)');
		grd.addColorStop(0.800, 'rgba(49, 11, 97, 1.00)');
		grd.addColorStop(1.000, 'rgba(70, 11, 97, 1.00)');

		// Fill with gradient
		con.fillStyle = grd;
		con.fillRect(0, 0, width, height);
		
		
		
		// ------------------- stars -------------------
		
		
		var foo = globalOffsetX / $(document).width() * 2;
		
		for(i = 0; i < stars.length; i++)
		{
			var star = stars[i];
			
			
			var xDif = star.x - starLightSource.x;
			var	yDif = star.y -	starLightSource.y;
			var dist = Math.sqrt(xDif * xDif + yDif * yDif);
			var canvasSize = Math.sqrt(width * width + height * height);
			
			
			dist /= (canvasSize / 1.7);
			
			dist = 1.0 - dist;
			
			dist = Math.max(0.2, dist);
			
			//console.log(globalOffsetX);
			//console.log(($(document).width() / (globalOffsetX + $(document).width()/2)));
			
			drawStar(star.x + -globalOffsetX, star.y + -globalOffsetY, 5, star.size, star.size/2.0, dist);
		}
		
		//console.log(globalOffsetX / $(document).width() * 2);
		//drawStar(starLightSource.x, starLightSource.y, 5, 20, 10, 1.0);
		
		if(typeof window.earthPrime != "undefined")
			window.earthPrime.renderFrame(new Date);
		
		con.restore();
	}, 30);
	
	
	
});