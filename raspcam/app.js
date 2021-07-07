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

	if( avgLum < 40 ) return "noir";
	else if( avgTeinte < 15 ) return "orange";
	else if( avgTeinte < 40 ) return "jaune";
	else if( avgTeinte < 100 ) return "vert";
	else if( avgTeinte < 190 ) return "bleu";
	else return "orange";

}


camera.on('read', function(err, timestamp, filename){

	Jimp.read( filename, function(err, image){

		var colorZ1 = getZoneColor( image, width*1/4, height/2, size );
		var colorZ2 = getZoneColor( image, width*1/2, height/2, size );
		var colorZ3 = getZoneColor( image, width*3/4, height/2, size );


		var code = "E";
		if( (colorZ1 == "orange" && colorZ2 == "noir" && colorZ3 == "vert") ||
			(colorZ1 == "vert" && colorZ2 == "noir" && colorZ3 == "orange") ) {
			code = "0";
		} else if( (colorZ1 == "jaune" && colorZ2 == "noir" && colorZ3 == "bleu") ||
			(colorZ1 == "bleu" && colorZ2 == "noir" && colorZ3 == "jaune") ) {
			code = "1";
		} else if( (colorZ1 == "bleu" && colorZ2 == "vert" && colorZ3 == "orange") ||
			(colorZ1 == "orange" && colorZ2 == "vert" && colorZ3 == "bleu") ) {
			code = "2";
		} else if( (colorZ1 == "jaune" && colorZ2 == "vert" && colorZ3 == "noir") ||
			(colorZ1 == "noir" && colorZ2 == "vert" && colorZ3 == "jaune") ) {
			code = "3";
		} else if( (colorZ1 == "noir" && colorZ2 == "jaune" && colorZ3 == "orange") ||
			(colorZ1 == "orange" && colorZ2 == "jaune" && colorZ3 == "noir") ) {
			code = "4";
		} else if( (colorZ1 == "vert" && colorZ2 == "jaune" && colorZ3 == "bleu") ||
			(colorZ1 == "bleu" && colorZ2 == "jaune" && colorZ3 == "vert") ) {
			code = "5";
		} else if( (colorZ1 == "bleu" && colorZ2 == "orange" && colorZ3 == "noir") ||
			(colorZ1 == "noir" && colorZ2 == "orange" && colorZ3 == "bleu") ) {
			code = "6";
		} else if( (colorZ1 == "vert" && colorZ2 == "orange" && colorZ3 == "jaune") ||
			(colorZ1 == "jaune" && colorZ2 == "orange" && colorZ3 == "vert") ) {
			code = "7";
		} else if( (colorZ1 == "noir" && colorZ2 == "bleu" && colorZ3 == "vert") ||
			(colorZ1 == "vert" && colorZ2 == "bleu" && colorZ3 == "noir") ) {
			code = "8";
		} else if( (colorZ1 == "orange" && colorZ2 == "bleu" && colorZ3 == "jaune") ||
			(colorZ1 == "jaune" && colorZ2 == "bleu" && colorZ3 == "orange") ) {
			code = "9";
		} else {
			console.log( "WAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
			if( colorZ2 == "bleu" ){		// Bleu milieu
						if( colorZ1 == "noir" || colorZ3 == "noir" )	code = "8"; 	// Noir/Vert/bleu
						else 						code = "9"; 	// Orange/Bleu/Vert
			} else if( colorZ2 == "noir" ){		// Noir milieu
						if( colorZ1 == "bleu" || colorZ3 == "bleu" )	code = "1"; 	// Jaune/Noir/Bleu
						else						code = "0"; 	// Orange/Bleu/Vert
			} else if( ( colorZ1 == "bleu" && colorZ3 == "noir" ) || ( colorZ1 == "noir" && colorZ3 == "bleu" ) ){
				code = "6";
			} else if( (colorZ1 != "bleu" && colorZ1 != "noir") && (colorZ2 != "bleu" && colorZ2 != "noir") && (colorZ3 != "bleu" && colorZ3 != "noir") ){
				code = "7";
			} else if( colorZ1 == "bleu" || colorZ3 == "bleu" ){
				if( colorZ2 == "vert") code = "2";
				else code = "5";
			} else if( colorZ1 == "noir" || colorZ3 == "noir" ){
				if( colorZ2 == "vert") code = "3";
				else code = "4";
			}
		}

		console.log( "\t\t\t\tZ1 : " + colorZ1 + "\tZ2: " + colorZ2 + "\tZ3: " + colorZ3 + "\tcas: " + code );

		port.write( code , function(err) {
			if(err) console.log(err);
		});

	});

});



