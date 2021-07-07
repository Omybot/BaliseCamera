var RaspiCam = require('raspicam');
var Jimp = require('jimp');
var convert = require('color-convert');
var SerialPort = require('serialport');

var width = 640;
var height = 480;
var size = 50;

var camera = new RaspiCam({
	mode:'photo',
	output:'cam.bmp',
	w:width,
	h:height,
	t:6000000,
	tl:1000,
	e:'bmp',
});




var port = null;

setTimeout( function(){

	if( port == null ){
		port = new SerialPort('/dev/ttyUSB0', {
			baudRate: 115200
		}, function(err){
			if(err){
				return console.log('Error : ', err.message);
			}

			camera.start();

			port.on('data', function(data){
				console.log(data);
			});
		});
	}
	
}, 8000 );

var getZoneColor = function( image, x, y, size ){
	
	var teinte = [];
	var lum = [];

	for( var j=y-Math.round(size/2); j<y+Math.round(size/2); j++ ){
		for( var i=x-Math.round(size/2); i<x+Math.round(size/2); i++ ){
			var pxColor = image.getPixelColor( i,j );
			var pxColRGB = Jimp.intToRGBA( pxColor );
			var hsl = convert.rgb.hsl( pxColRGB.r, pxColRGB.g, pxColRGB.b );
			teinte.push( hsl[0] );
			lum.push( hsl[2] );
		}
	}

	teinte.sort( function(a,b){ return a-b; } );
	lum.sort( function(a,b){ return a-b; } );

	teinte = teinte.slice( teinte.length *5/100, teinte.length *95/100 );
	lum = lum.slice( teinte.length *5/100, teinte.length *95/100 );

	var avgTeinte = 0;
	for( let i=0; i<teinte.length ; i++ ){
		avgTeinte += teinte[i];
	}
	var avgLum = 0;
	for( let i=0; i<lum.length ; i++ ){
		avgLum += lum[i];
	}
	
	var avgTeinte = avgTeinte / teinte.length / 360 * 240;
	var avgLum = avgLum / lum.length / 100 * 240;

	console.log( "teinte : " + avgTeinte.toFixed(0) + "\tluminosité : " + avgLum.toFixed(0) );

	return avgLum;

	//if( avgLum < 100 ){
	//	console.log("noir");
	//	return "noir";
	//} else {
	//	console.log("blanc");
	//	return "blanc";
	//}

	//if( avgLum < 40 ) return "noir";
	//else if( avgTeinte < 15 ) return "orange";
	//else if( avgTeinte < 40 ) return "jaune";
	//else if( avgTeinte < 100 ) return "vert";
	//else if( avgTeinte < 190 ) return "bleu";
	//else return "orange";

}


camera.on('read', function(err, timestamp, filename){

	Jimp.read( filename, function(err, image){

		var lumHigh = getZoneColor( image, width*1/2, height*1/4 , size );
		var lumLow = getZoneColor( image, width*1/2, height*3/4 , size );

		var code;
		if( lumHigh > lumLow ){
			console.log("Blanc up");
			code = "B";
		} else {
			console.log("Noir Up");
			code = "N";
		}

//		var code = "E";
//		if( color == "noir" ) 	code = "N";
//		else if( color == "blanc" ) 	code = "B";
//		else			code = "E";

		port.write( code , function(err) {
			if(err) console.log(err);
		});

	});

});

