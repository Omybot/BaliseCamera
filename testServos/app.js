var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0', {
		baudRate: 19200
	}, function(err){
	if(err){
		return console.log('Error : ', err.message);
	}
});

port.on('data', function(data){
	console.log(data);
});


setInterval( function(){
	var string;
	if( i==0 ){
		i=9;
		string = "0";
	}else{
		i=0;
		string = "9";
	}
	console.log(string);
	port.write( string , function(err) {
		if(err) console.log(err);
	});
	//port.write('1234567890', function(err){
	//	console.log( err );
	//});
}, 5000 );


var setServo = function( servoNumber, value, callback ){

	var buf = Buffer.alloc(10);

	buf[1] = servoNumber;
	buf[2] = value / 0x100;
	buf[3] = value % 0x100;

	port.write( buf, function(err){
		if(err) return callback("sendError");
		callback( null, buf );
	}

}
