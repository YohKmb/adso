"use strict"

const CDP = require("chrome-remote-interface")
// sudo /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
// "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222


class RunmtcClient {

    constructor(wsock) {
        this._wsock = wsock
        this._cdpclient = undefined
        this._connections = {}
        this._connections_rev = {}
        this._scripts = {}
        this._url = ""
    }

    async enable() {
        console.log("Starting client.enable")

        let self = this

        try {
            const _client = await CDP()
            const {Network, Page, Debugger} = _client
            self._cdpclient = _client

            // Page.loadEventFired(() => {
            //     self._cdpclient.close()
            // })

            Debugger.scriptParsed((params) => {
                self._scripts[params.scriptId] = params.url
            })

            Debugger.scriptFailedToParse((params) => {
                self._scripts[params.scriptId] = params.url
            })

            Network.responseReceived((params) => {
                let res = params.response
                let resInfo = {
                    mimeType: res.mimeType,
                    status: res.status
                }
                if (res.securityDetails) {
                    Object.assign(resInfo, {
                        protocol: res.securityDetails.protocol,
                        subjectName: res.securityDetails.subjectName,
                        issuer: res.securityDetails.issuer
                    })
                }
                let rsrcInfo = self._connections_rev[params.requestId] || {}
                self._connections_rev[params.requestId] = Object.assign(
                    rsrcInfo,
                    // self._connections_rev[params.requestId],
                    {
                        mimeType: res.mimeType,
                        status: res.status,
                    })
            })

            // Network.dataReceived((params) => {
            //     Object.assign(
            //         self._connections_rev[params.requestId],
            //         {
            //             dataLength: params.dataLength
            //         })
            // })

            Network.loadingFinished((params) => {
                let rsrcInfo = Object.assign(
                    self._connections_rev[params.requestId],
                    {
                        id: params.requestId,
                        dataLen: params.encodedDataLength
                    })
                // console.log(rsrcInfo)
                self.sendUpdateCommand(rsrcInfo)
                // let dataLen = params.encodedDataLength
            })

            Network.loadingFailed((params) => {
                let rsrcInfo = Object.assign(
                    self._connections_rev[params.requestId],
                    {
                        id: params.requestId,
                        error: params.errorText
                    })
                // console.log(rsrcInfo)
                self.sendUpdateCommand(rsrcInfo)
                // let errorDesc = params.errorText
            })

            Network.requestWillBeSent(async (params) => {
                const initiator = params.initiator
                const url_req = params.request.url

                self._connections[url_req] = {requestId: params.requestId}
                self._connections_rev[params.requestId] = {}

                let statements = []
                try {
                    statements = await self.getRcsRequiringInfo(initiator, url_req) // returns dir keys [scriptLine, caution]
                } catch (err) {
                    console.warn(err)
                    // throw err
                }

                let rsrcInfo = {
                    requestId: params.requestId,
                    statements: statements,
                    url: url_req,
                    type: params.type
                }
                let respInfo = self._connections_rev[params.requestId]
                if (respInfo) {
                    Object.assign(rsrcInfo, respInfo)
                }

                self.sendAddCommand(RunmtcClient.reformatNewRsrcInfo(rsrcInfo))
                // self._wsock.send(
                //     JSON.stringify(
                //         RunmtcClient.reformatNewRsrcInfo(rsrcInfo)
                //     )
                // )

            }, (err) => {
                console.error("[*] Error: On Network.requestWillBeSent - ", err.message)
                return {
                    requestId: params.requestId,
                    statements: {
                        url: params.url,
                        statements: [err.message]
                    }
                }
            })

            console.log("Exit client.enable")

            return Promise.all([
                Network.enable(),
                Page.enable(),
                Debugger.enable(),
                Network.setCacheDisabled({cacheDisabled: true}),
                Network.clearBrowserCache()
            ])

        } catch (err) {
            console.error(err)
        }
    }

    sendDataWithWs (objdata) {
        try {
            this._wsock.send(
                JSON.stringify(objdata)
                // RunmtcClient.reformatNewRsrcInfo(objdata)
            )
        } catch (err) {
            throw err
        }

    }

    async getScriptSource (scriptId) {
        const { Debugger } = this._cdpclient
        const sourceInfo = await Debugger.getScriptSource(scriptId)

        return sourceInfo.scriptSource
    }

    async getResponseBody (requestId) {
        const { Network } = this._cdpclient
        const respInfo = await Network.getResponseBody(requestId)

        return respInfo.body
    }

    async getRcsRequiringInfo  (initiator, url_req)  {
        let statements = []
        let caution = undefined
        let fromId = null

        try {
            switch (initiator.type) {
                case "other":
                    if (url_req === this._url) {
                        caution = "[*] Root URL Resource"
                    }
                    statements = [{
                        url: url_req,
                        fromId: null,
                        directive: caution,
                        caution: caution,
                        type: initiator.type
                    }]
                    break

                case "script":
                    let stack = initiator.stack
                    let callFrames = stack.callFrames || []

                    try {
                        while (callFrames.length === 0 && stack.hasOwnProperty("parent")) {
                            stack = stack.parent
                            callFrames = stack.callFrames
                            // console.log(callFrames)
                        }
                        // let fromUrls = removeDuplexElem(stack.callFrames.map(function (callframe) {
                        statements = await Promise.all(callFrames.map(async (callframe) => {
                            // let url = self._scripts[callframe.scriptId]
                            let url = callframe.url || this._scripts[callframe.scriptId]
                            if (url) {
                                // console.log(self._connections[url].requestId, url_req)
                                try {
                                    // let statement =  {
                                    //         fromId: this._connections[url].requestId,
                                    //         type: initiator.type
                                    // }
                                    let statement =  Object.assign(callframe,
                                        {
                                            fromId: this._connections[url].requestId,
                                            type: initiator.type
                                        },
                                        callframe )
                                    return statement

                                } catch (err) {
                                    // console.warn("no url: " , url)
                                    return null
                                }
                            } else {
                                // console.warn("no url: " , url)
                                return null
                            }
                        }))

                        statements = statements.filter((statement) => {
                            return !!statement
                        })

                    } catch (err) {
                        console.warn(err)
                        console.log(JSON.stringify(initiator))
                        console.log(JSON.stringify(url_req))
                    }
                    break

                case "parser":
                    let init_url = initiator.url

                    if (initiator.lineNumber === 0) {
                        caution = "[!] The lineNumber 0 might mean a failure of getting information."
                    }

                    try {
                        fromId = this._connections[init_url].requestId
                    } catch (err) {}

                    statements = [{
                        url: init_url,
                        fromId: fromId,
                        caution: caution,
                        lineNumber: initiator.lineNumber,
                        type: initiator.type
                    }]
                    break

                default:
                    console.warn(new Error(`[*] Error: Type of the initiator is invalide (${initiator.type})`))
            }
        } catch (err) {
            console.warn(err)
            // throw err
        }

        return statements
    }

    static reformatNewRsrcInfo (rsrcInfo) {
        let group = RunmtcClient.convertType2Group(rsrcInfo.type)
        let from = undefined

        if (rsrcInfo.hasOwnProperty("statements")) {
            from = rsrcInfo["statements"]["fromId"]
        }

        const addedProps = {
            id: rsrcInfo.requestId,
            label: "",
            title: rsrcInfo.url,
            group: group,
            from: from
        }

        return Object.assign(rsrcInfo, addedProps)
        // return {
        //     cmd: "add",
        //     data: Object.assign(rsrcInfo, addedProps)
        // }
    }

    sendAddCommand (rsrcInfo) {
        try {
            this.sendDataWithWs({
                cmd: "add",
                data: rsrcInfo
            })
        } catch (err) {
            console.warn(err)
        }
    }

    sendUpdateCommand (rsrcInfo) {
        try {
            this.sendDataWithWs({
                cmd: "update",
                data: rsrcInfo
            })
        } catch (err) {
            console.warn(err)
        }
    }

    static convertType2Group (rsrcType) {
        // cf. https://chromedevtools.github.io/devtools-protocol/tot/Page#type-ResourceType
        //   Document, Stylesheet, Image, Media, Font, Script, TextTrack, XHR, Fetch, EventSource, WebSocket, Manifest, Other.
        let group = "unknown"

        switch (rsrcType) {
            case "Document":
                group = "html"
                break
            case"Script":
                group = "js"
                break
            case "Stylesheet":
                group = "css"
                break
            case "Image":
                group = "image"
                break
            case "Media":
                group = "media"
                break
            case "Font":
                group = "font"
                break
            case "XHR":
                group = "data"
                break
            case "WebSocket":
            case "Fetch":
                group = "async"
                break
            default:
                break
        }

        return group
    }

    close () {
        this._cdpclient.close()
            .then(() => {
                console.log(`[*] CDP client was successfully closed.`)
            })
            .catch((err) => {
                throw err
            })
    }

    navigate(url) {
        this._url = url
        const {Page} = this._cdpclient

        Page.navigate({url: url})
            .then(async () => {
                await Page.loadEventFired()
                return
            })
            .catch((err) => {
                console.warn(err)
            })

    }
}

module.exports = {
    RunmtcClient: RunmtcClient,
}
