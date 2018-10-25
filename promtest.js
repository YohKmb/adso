var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 8182});

wss.on('connection', function(ws) {
	console.log('client connected');
	ws.on('message', function(message) {
		console.log(message);
    });
	setInterval(() => {
	    let data = {label: "test", id: (Math.random() * 1e7).toString(32)}
	    console.log(data)
        ws.send(JSON.stringify(data))
    }, 5000)
});