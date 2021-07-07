var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0', {
		baudRate: 115200
	}, function(err){
	if(err){
		return console.log('Error : ', err.message);
	}
});

//port.on('data', function(data){
//	console.log(data);
//});

//port.on('readable', function(){
//	console.log( port.read() );
//});

var i = 0;

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
