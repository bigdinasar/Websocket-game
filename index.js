const express = require('express')
// const model = require('./model')
const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080
const app = express()
app.use(express.urlencoded({ extended: false}))
app.use(express.static("public"))

var server = app.listen(PORT, function() {
  console.log(`server is running ${PORT}`)
})

//const wss = new WebSocket.WebSocketServer({ server });
const wss = new WebSocket.WebSocketServer({ server: server });

var boardState = [[0,0,0], [0,0,0], [0,0,0]];

var totalSeconds = 0;

var otherSeconds = 0;

var gameOver = false;

var gameOn = false;

var myClients = [];

var myClientLvls = {};


function sendActionToAllClients(actionObject) {
  
  var message = JSON.stringify(actionObject);
  wss.clients.forEach( function (client) {
    console.log("sending: ", message)
    // console.log("sending to: ", client);
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function sendActionSelf( ws, actionObject) {
  
  var message = JSON.stringify(actionObject);
  wss.clients.forEach( function (client) {
    console.log("sending: ", message)
    // console.log("sending to: ", client);
    if (client == ws && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}




wss.on('connection', function (ws) { // event: server recieved new WS client connection
	myClients.push(ws); // track each client in order of connection
  // ws.id = uuid.v4();
  // ws.id = crypto.randomUUID(),
  ws.id = uuidv4();
  console.log("ws.id: ", ws.id);
  myClientLvls[ws.id] = 1;

  sendActionSelf( ws, {
    action: "identify",
		id: ws.id
  });

	sendActionToAllClients({
		action: "updateBoard",
		board: boardState,
    game: gameOver,
    lvls: myClientLvls
	});

  sendActionToAllClients({
		action: "updateTimer",
		newTime: totalSeconds,
    newOtime: otherSeconds,
    how: false,
    gameOn: gameOn
	});

	ws.on('error', function(error) { // event: some error with connection
		console.error("Connection error", error)
	});

	ws.on('message', function (data) { // event: data received from client
		var message = JSON.parse(data); // access data contained within the message
		if (message.action == 'mark') {
			boardState[message.position[0]] [message.position[1]] -= message.diff;
      //console.log("message.id: ", message.id);
      myClientLvls[message.player] = message.diff;
      //console.log("myClientLvls: ", myClientLvls)
      sendActionToAllClients({
        action: "updateBoard",
        board: boardState,
        game: gameOver,
        lvls: myClientLvls
      });
		}

    if (message.action == 'restart') {
      totalSeconds = 0;
      otherSeconds = 0;
      gameOver = false;

      for (row in boardState) {
        boardState[row][0] = 0;
        boardState[row][1] = 0;
        boardState[row][2] = 0;
      }

      sendActionToAllClients({
        action: "reset",
        board: boardState,
        game: gameOver,
        startBaton: true,
        gameOn: false,
        newTime: totalSeconds,
        newOtime: otherSeconds,
      });


    }

    if (message.action == 'timeInc') {
      console.log('message:', message)
      console.log('newTime:', message.newTime)
			totalSeconds = message.newTime;
      otherSeconds = message.newOtime;
      gameOn = message.gameOn;
      console.log('new totalSeconds:', totalSeconds)
      console.log('new otherSeconds:', otherSeconds)
			
			sendActionToAllClients({
				action: "updateTimer",
				newTime: totalSeconds,
        newOtime: otherSeconds,
        gameOn: true
			});

      // for (row in boardState) {
      //   for (col in row) {
      //     boardState[col][row] += totalSeconds;
      //   }
      // }
      for (row in boardState) {
        boardState[row][0] += otherSeconds;
        boardState[row][1] += otherSeconds;
        boardState[row][2] += otherSeconds;
      }
      for (row in boardState) {
        if (
          boardState[row][0] > 850 |
          boardState[row][1] > 850 |
          boardState[row][2] > 850
        ) {
          gameOver = true;
        }
        
      }
      
      sendActionToAllClients({
        action: "updateBoard",
        board: boardState,
        game: gameOver,
        lvls: myClientLvls
      });
		}

    if (message.action == 'halfTime') {
			otherSeconds = Math.floor(otherSeconds / 2);
      sendActionToAllClients({
				action: "updateTimer",
				newTime: totalSeconds,
        newOtime: otherSeconds,
        gameOn: true
			});
      sendActionToAllClients({
        action: "updateBoard",
        board: boardState,
        game: gameOver,
        lvls: myClientLvls
      });
		}
	
		
	});
});


// wss.on('connection', function (ws) {
//   // add new connection to clients list
//   //console.log("adding client: ", ws);
//   myClients.push(ws);

//   sendActionToAllClients({
//     action: "updateBoard",
//     board: boardState
//   });

//   ws.on('message', (msg) => {
//     ws.clients.forEach((client) => {
//       if(client.readyState === WebSocket.OPEN) {
//         client.send(msg);
//       }
//     })
//   });
// })


/////////////////////////// whatever ///////////////////////////

// const ws = new WebSocket('ws://localhost:8080');

// ws.on('error', console.error);

// ws.on('open', function open() {
//   ws.send('something');
// });

// ws.on('message', function message(data) {
//   console.log('received: %s', data);
// });

/////////////////////// FROM PICTURES OF EARLIER CLASS ///////////////////////////////////

// const WebSocket = require('ws')

// const wss = new WebSocket.WebSocketServer({ port: 8080 });

// wss.on('connection', function (ws) {
//     ws.on('error', function (error) {
//         console.error("connection error:", error)
//     })

//     ws.on('message', function (data, isBinary) {
//         wss.clients.forEach(function (client) {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(data, {binary: isBinary })
//             }
//         })
//     })
// })

///////// FROM CHAT GPP ///////////////////////////////////////////////////////////////////////////

// const WebSocket = require('ws')

// const wss = new WebSocket.Server({ port: 8080 })

// var boardState = [[0,0,0], [0,0,0], [0,0,0]]

// var myClients = [];

// function sendActionToAllClients(actionObject) {
//     var message = JSON.stringify(actionObject);
//     wss.clients.forEach(function (client) {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(message)
//         }
//     });
// }

// wss.on('connection', function (ws) { // event: server received new WS client connection
//     myClients.push(ws); // track each client in order of connection
//     ws.on('error', function(error) { // event: some error with the connection
//         console.error("connection error:", error)
//     })

//     ws.on('message', function (data) { // event: data received from client
//         var message = JSON.parse(data)
//         if (ws.readyState === WebSocket.OPEN) {
//             if (message.action === "mark") {
//                 boardState[message.position[0]][message.position[1]] = message.player
//             }
//             sendActionToAllClients( {
//                 action: "updateBoard",
//                 board: boardState
//             })
//         }
//     })
// })

///////////////FROM CLASS ??????/////////////////////////////////////////////////////////

// const WebSocket = require('ws')

// const wss = new WebSocket.WebSocketServer({ port: 8080 })

// var boardState = [[0,0,0], [0,0,0], [0,0,0]]

// var myClients = [];

// function sendActionToAllClients(actionObject) {
//     var message = JSON.stringify(actionObject);
//     wss.clients.forEach(function (client) {
//         if (client.readyState === WebSocket.OPEN) {
            
//             client.send(message)
//         }
//     });
// }

// wss.on('connection', function (ws) { // event: server received new WS client connection
//     myClients.push(ws); // track each client in order of concection
//     ws.on('error', function(error) { // event: some error with the connection
//         console.error("connection error:", error)
//     })

//     ws.on('message', function (data, isBinary) { // event: data received from client
//         var message = JSON.parse(data)
//         if (client.readyState === WebSocket.OPEN) {
//             if (message.action === "mark") {
//                 boardState[message.position[0]][message.position[1]] = message.player
//             }
//             sendActionToAllClients( {
//                 action: "updateBoard",
//                 board: boardState
//             })

//             //client.send(data, {binary: isBinary});
//         }
//     })
// })