

Vue.createApp({

    data: function () {
        return {
            totalSeconds: 0,
            blue: false,
            otherSeconds: 0,
            stopInterval: null,
            startBaton: true,
            id: null,
            boardState: [],
            playerLvl: 1,
            playerLvls: {},
            howTo: false,
            gameOn: false,
            audio : new Audio('barrel-exploding-soundbible.mp3'),
            div: false,
            gameOver: false,
            socket: null
        };
    },

    methods: {
        move: function(row, col) {
            if (this.gameOn) {
                console.log(row, col)  
                this.playerLvl += 1;
                console.log("player level:", this.playerLvl);
                console.log("id:", this.id);
                var message = {
                    action: 'mark',
                    position: [row, col],
                    diff: this.playerLvl,
                    player: this.id
                }
                this.sendMessage(message);
            }    
        },

        howToo: function() {

            if (this.gameOn) {
                this.startBaton = false
            }
    
            if (this.gameOn && this.howTo) {
                this.howTo = false
            } else if (this.gameOn && !this.howTo) {
                this.howTo = true
            } else if (!this.gameOn && this.howTo) {
                this.howTo = false
                this.startBaton = true
            } else if (!this.gameOn && !this.howTo) {
                this.howTo = true,
                this.startBaton = false
            }
        },

        setTime: function() {
            this.startBaton = false;
            this.stopInterval = setInterval(this.incTime, 1000);
        },

        halfTime: function() {
            var message = {
                action: 'halfTime'
            }
            this.sendMessage(message)
        },

        incTime: function() {
            // this.totalSeconds++
            if (this.gameOn) {
                this.startBaton = false
            }
            console.log("time:", this.totalSeconds)
            var message = {
                action: 'timeInc',
                newTime: this.totalSeconds + 1,
                newOtime: this.otherSeconds + 1,
                gameOn: true,
            }
            this.sendMessage(message)
        },

        restart() {
            var message = {
                action: 'restart',
            }
            this.sendMessage(message)
            this.gameOn = false;
        },

        receiveMessage: function (data) {

            if (data.action == "updateBoard") {
                console.log("new board:", data.board)
                console.log("game over:", data.game)
                this.boardState = data.board;
                this.gameOver = data.game;
                console.log("this.gameOver: ", this.gameOver)
                console.log("playerLvls: ", data.lvls)
            }

            if (data.action == "updateTimer") {
                console.log("new time:", data.newTime)
                console.log("gameOn: ", data.gameOn)
                this.totalSeconds = data.newTime;
                this.otherSeconds = data.newOtime;
                this.gameOn = data.gameOn;
                if (this.gameOn) {
                    this.startBaton = false
                }
            }

            

            if (data.action == "identify") {
                this.id = data.id;
                console.log("this.id: ", this.id);
                console.log("data.id: ", data.id);
            }

            if (data.action == "reset") {
                console.log("resetting game");
                this.totalSeconds = data.newTime;
                this.otherSeconds = data.newOtime;
                this.boardState = data.board;
                this.gameOver = data.game;
                this.startBaton = data.startBaton;
                this.playerLvl = 1;
                this.gameOn = false;
            }

            if (this.gameOver == true) {
                clearInterval(this.stopInterval);
                this.audio.play();
            }

        },

        sendMessage: function (data) {
            console.log("sending: data.action", data.action)
            //console.log("socket: ", this.socket)
            this.socket.send(JSON.stringify(data));
        }
    },

    created: function () {
        this.socket = new WebSocket("wss://s24-websocket-bigdinasar.onrender.com");
        //https://s24-websocket-bigdinasar.onrender.com
        //this.socket = new WebSocket("wss://render.com") wss because secure

        // this.socket.id = new uuidv4();

        // this.playerLvls[this.socket.id] = 1;

        // console.log('this.socket.id: ', this.socket.id)

        this.socket.onmessage = (event) => {
            //console.log("receiving: ", event)
            this.receiveMessage(JSON.parse(event.data));
        };
    }

}).mount("#app");
