"use strict"
// sudo /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
// "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222


const express = require('express')
const swig = require('swig')
const path = require("path")
const { RunmtcClient } = require("./cdpclient")
const { vizjsOption, headersDetailTable, wsPort } = require("./config/options")
// const { RunmtcClient, wsPort } = require("./cdpclient")
const WebSocket = require('ws')


const srvPort = 1337
const WebSocketServer = WebSocket.Server,
    wss = new WebSocketServer({port: wsPort})
// let sock = null

const app =  express()

const wsUrl = `ws://localhost:${wsPort}`
// const rootUrl = 'http://localhost:8000/iframetest.html'


app.engine('html', swig.renderFile)

app.set('view engine', 'html')
app.set('views', __dirname + '/views')

app.set('view cache', false)
swig.setDefaults({ cache: false })

app.use('/static', express.static(path.join(__dirname, 'static')))


app.get('/', function (req, res) {
  res.render("main",
      {
          wsUrl: wsUrl,
          vizjsOption: vizjsOption,
          headersDetailTable: headersDetailTable
      })
})


wss.on("connection", (sock) => {
    console.log(`[*] Connection was established.`)
    const client = new RunmtcClient(sock)

    sock.on("message", function(message) {
		console.log(message)

        try {
		    let cmd = JSON.parse(message)
            switch (cmd.cmd) {
                case "startTracing":
                    let url = cmd.data
                    // const client = new RunmtcClient(sock)
                    client.enable()
                    // client.enable.call(client)
                        .then(() => {
                            client.navigate(url)
                        })
                        .catch((err) => {
                            console.error(err)
                        })
                    break
                default:
                    console.warn("Unknown commmand: ", cmd.cmd)
                    break
            }
        } catch (err) {
            console.warn(err)
        }
    })

    sock.on("error", function (err) {
        console.error(err)
        try {
            client.close()
        } catch (err) {
            console.warn(err)
        }
    })

    sock.on("close", function (reasonCode, description) {
        console.log(`Clinet left. Code: ${reasonCode}, Description: ${description}`)
        try {
            client.close()
        } catch (err) {
            console.warn(err)
        }
    })

})


app.listen(srvPort)
console.log(`Application Started on http://localhost:${srvPort}/`)