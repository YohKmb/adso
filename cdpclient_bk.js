"use strict"

const CDP = require("chrome-remote-interface")
// sudo /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222


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
                Object.assign(
                    self._connections_rev[params.requestId],
                    {
                        mimeType: res.mimeType,
                        status: res.status,
                        // securityDetails: params.securityDetails
                        // securityDetails
                    })
            })

            Network.dataReceived((params) => {
                Object.assign(
                    self._connections_rev[params.requestId],
                    {
                        dataLength: params.dataLength
                    })
            })

            Network.loadingFinished((params) => {
                // console.log(`${"LoadFinished"}: ${params.requestId}`)
            })

            Network.requestWillBeSent(async (params) => {
                const initiator = params.initiator
                const url_req = params.request.url

                // self._nRsrcs += 1
                // console.log(`${"BeSent"}: ${params.requestId}`)
                // console.log(`${self._nRsrcs}: ${url_req}`)
                // console.log('  ', JSON.stringify(initiator))

                self._connections[url_req] = {requestId: params.requestId}
                self._connections_rev[params.requestId] = {}

                let statements = []
                try {
                    statements = await self.getRcsRequiringStatement(initiator, url_req, self._url) // returns dir keys [scriptLine, caution]
                    // statements = await getRcsRequiringStatement.call(this, params.initiator, url_req, this._url) // returns dir keys [scriptLine, caution]
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
                // console.log(JSON.stringify(
                //         rsrcInfo
                //         // reformatNewRsrcInfo(rsrcInfo)
                //     ))
                let respInfo = self._connections_rev[params.requestId]
                if (respInfo) {
                    Object.assign(rsrcInfo, respInfo)
                }

                // console.log(`${self._nRsrcs}: ${JSON.stringify(
                //         rsrcInfo
                        // reformatNewRsrcInfo(rsrcInfo)
                    // )}`)
                self._wsock.send(
                    JSON.stringify(
                        RunmtcClient.reformatObjForViz(rsrcInfo)
                    )
                )

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

            // const getRcsRequiringStatement = async (initiator, url_req, rootUrl) => {
            //     let statements = []
            //     let caution = undefined
            //     let content = ""
            //     let fromId = null
            //
            //     try {
            //         switch (initiator.type) {
            //             case "other":
            //                 if (url_req === rootUrl) {
            //                     caution = "[*] Root URL Resource"
            //                 }
            //                 statements = [{
            //                     url: url_req,
            //                     fromId: null,
            //                     directive: caution,
            //                     caution: caution,
            //                     type: initiator.type
            //                 }]
            //                 break
            //
            //             case "script":
            //                 let stack = initiator.stack
            //                 let callFrames = stack.callFrames || []
            //
            //                 try {
            //                     while (callFrames.length === 0 && stack.hasOwnProperty("parent")) {
            //                         stack = stack.parent
            //                         callFrames = stack.callFrames
            //                         // console.log(callFrames)
            //                     }
            //                     // let fromUrls = removeDuplexElem(stack.callFrames.map(function (callframe) {
            //                     statements = await Promise.all(callFrames.map(async (callframe) => {
            //                         // let url = self._scripts[callframe.scriptId]
            //                         let url = callframe.url || self._scripts[callframe.scriptId]
            //                         if (url) {
            //                             // console.log(self._connections[url].requestId, url_req)
            //                             try {
            //                                 // if (! self._connections[url].requestId) {
            //                                 //     console.warn(self._connections[url].requestId)
            //                                 // }
            //                                 let statement =  Object.assign(callframe,
            //                                     {
            //                                         fromId: self._connections[url].requestId,
            //                                         type: initiator.type
            //                                     },
            //                                     await self.getScriptContentbyId(callframe) )
            //                                 return statement
            //
            //                             } catch (err) {
            //                                 // console.warn("no url: " , url)
            //                                 return null
            //                             }
            //                         } else {
            //                             // console.warn("no url: " , url)
            //                             return null
            //                         }
            //                         // return callframe.url || self._scripts[callframe.scriptId]
            //                     }))
            //                     // console.log(JSON.stringify(statements))
            //                     // if (statements.length === 0) {
            //                         // let url = callframe.url || self._scripts[callframe.scriptId]
            //                         // console.warn("  ", url_req, JSON.stringify(initiator))
            //                     // }
            //                     // console.log("Before: ", JSON.stringify(statements))
            //                     statements = statements.filter((statement) => {
            //                         return !!statement
            //                     })
            //                     // console.log("After: ", JSON.stringify(statements))
            //
            //                     // For Dev
            //                     // if (fromUrls.length > 1) {
            //                     //     console.warn("[!] Multiple fromIds exit !")
            //                     //     console.log(fromUrls)
            //                     // } else if (fromUrls.length === 0) {
            //                     //     console.warn("[!] Empty fromIds exit !")
            //                     //     // console.log(JSON.stringify(stack))
            //                     // }
            //                     // fromIds = fromUrls.map(function (fromUrl) {
            //                     //     return self._connections[fromUrl].requestId
            //                         // return this._connections[fromUrl].requestId
            //                     // })
            //                     // fromIds = this._connections[fromIds[0]].requestId
            //                     // console.log("fromIds", fromIds)
            //                     // fromId = this._connections[initiator.url]
            //                 } catch (err) {
            //                     console.warn(err)
            //                     console.log(JSON.stringify(initiator))
            //                     console.log(JSON.stringify(url_req))
            //                 }
            //                 // statements = Object.assign({
            //                 //         url: url_req,
            //                 //         fromIds: fromIds,
            //                 //         caution: caution,
            //                 //         type: initiator.type
            //                 //     },
            //                 //     {statements: await getStatementsInStack(stack, url_req)})
            //                 break
            //
            //             case "parser":
            //                 let init_url = initiator.url
            //                 // let scriptLine = ""
            //
            //                 // content = await self.getRespbodyByUrl(init_url)
            //                 // content = content.split(/\r\n|\r|\n/)
            //                 // scriptLine = content[initiator.lineNumber]
            //                 if (initiator.lineNumber === 0) {
            //                     caution = "[!] The lineNumber 0 might mean a failure of getting information."
            //                 }
            //
            //                 // let fromId = this._connections[init_url]
            //                 try {
            //                     fromId = self._connections[init_url].requestId
            //                     // console.info("fromIds: ", fromIds)
            //                     // fromIds = [this._connections[init_url].requestId]
            //                 } catch (err) {}
            //                 // console.warn(fromId, url_req, init_url)
            //                 statements = [{
            //                     url: init_url,
            //                     fromId: fromId,
            //                     // from: init_url,
            //                     // directive: scriptLine,
            //                     caution: caution,
            //                     lineNumber: initiator.lineNumber,
            //                     type: initiator.type
            //                 }]
            //                 break
            //
            //             default:
            //                 console.warn(new Error(`[*] Error: Type of the initiator is invalide (${initiator.type})`))
            //         }
            //     } catch (err) {
            //         console.warn(err)
            //         // throw err
            //     }
            //
            //     // console.log(url_req)
            //     // if (url_req.includes("ui")) {
            //     //     console.warn(JSON.stringify(statements))
            //     // }
            //     return statements
            //     // return {scriptLine: scriptLine, caution: caution}
            // }
            // .bind(this)

            // const getStatementsInStack = async (stack, url_req) => {
            //     let statements
            //     let froms
            //     const callframes = stack.callFrames
            //
            //     try {
            //         froms = removeDuplexElem(callframes.map((frame) => {
            //             return frame.url
            //         }))
            //         statements = []
            //         if (froms.length !== 1) {
            //             statements = {
            //                 statement: undefined,
            //                 caution: undefined
            //             }
            //
            //         } else {
            //             statements = Promise.all(callframes.map(async (frame) => {
            //                 let lineAndCaution = await getScriptContentbyId(frame.scriptId)
            //                 Object.assign({
            //                     lineNumber: frame.lineNumber,
            //                     columnNumber: frame.columnNumber
            //                 }, lineAndCaution)
            //             }))
            //         }
            //         return statements
            //
            //     } catch (err) {
            //         console.error(err.stack)
            //         return ""
            //     }
            // }

            // const removeDuplexElem = (arr) => {
            //     return arr.filter((x, idx, arrself) => {
            //         return arrself.indexOf(x) === idx
            //     })
            // }

            // const getScriptContentbyId = async (frame) => {
            //     let scriptId = frame.scriptId
            //     try {
            //         let content = await Debugger.getScriptSource({scriptId: scriptId})
            //         content = content.scriptSource.split(/\r\n|\r|\n/)
            //         let scriptLine = content[frame.lineNumber]
            //         let caution = undefined
            //         if (frame.lineNumber === 0) {
            //             caution = "[!] The lineNumber 0 might mean a failure of getting information."
            //         }
            //         return {
            //             directive: scriptLine,
            //             caution: caution,
            //             lineNumber: frame.lineNumber,
            //             columnNumber: frame.columnNumber
            //         }
            //     } catch (err) {
            //         return {
            //             directive: undefined,
            //             caution: "[!] An errror occured..."
            //         }
            //     }
            // }

            const getFrameUrlById = (frameId) => {
                try {
                    //
                } catch (err) {
                    return "[!] Frame URL could not be obtained..."
                }
            }

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
    async getRcsRequiringStatement  (initiator, url_req, rootUrl)  {
        // console.log(url_req, rootUrl)
        let statements = []
        let caution = undefined
        // let content = ""
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
                                    // if (! self._connections[url].requestId) {
                                    //     console.warn(self._connections[url].requestId)
                                    // }
                                    let statement =  Object.assign(callframe,
                                        {
                                            fromId: this._connections[url].requestId,
                                            type: initiator.type
                                        },
                                        await this.getScriptContentbyId(callframe) )
                                    return statement

                                } catch (err) {
                                    // console.warn("no url: " , url)
                                    return null
                                }
                            } else {
                                // console.warn("no url: " , url)
                                return null
                            }
                            // return callframe.url || self._scripts[callframe.scriptId]
                        }))
                        // console.log(JSON.stringify(statements))
                        // if (statements.length === 0) {
                            // let url = callframe.url || self._scripts[callframe.scriptId]
                            // console.warn("  ", url_req, JSON.stringify(initiator))
                        // }
                        // console.log("Before: ", JSON.stringify(statements))
                        statements = statements.filter((statement) => {
                            return !!statement
                        })
                        // console.log("After: ", JSON.stringify(statements))

                        // For Dev
                        // if (fromUrls.length > 1) {
                        //     console.warn("[!] Multiple fromIds exit !")
                        //     console.log(fromUrls)
                        // } else if (fromUrls.length === 0) {
                        //     console.warn("[!] Empty fromIds exit !")
                        //     // console.log(JSON.stringify(stack))
                        // }
                        // fromIds = fromUrls.map(function (fromUrl) {
                        //     return self._connections[fromUrl].requestId
                            // return this._connections[fromUrl].requestId
                        // })
                        // fromIds = this._connections[fromIds[0]].requestId
                        // console.log("fromIds", fromIds)
                        // fromId = this._connections[initiator.url]
                    } catch (err) {
                        console.warn(err)
                        console.log(JSON.stringify(initiator))
                        console.log(JSON.stringify(url_req))
                    }
                    // statements = Object.assign({
                    //         url: url_req,
                    //         fromIds: fromIds,
                    //         caution: caution,
                    //         type: initiator.type
                    //     },
                    //     {statements: await getStatementsInStack(stack, url_req)})
                    break

                case "parser":
                    let init_url = initiator.url
                    // let scriptLine = ""

                    // content = await self.getRespbodyByUrl(init_url)
                    // content = content.split(/\r\n|\r|\n/)
                    // scriptLine = content[initiator.lineNumber]
                    if (initiator.lineNumber === 0) {
                        caution = "[!] The lineNumber 0 might mean a failure of getting information."
                    }

                    // let fromId = this._connections[init_url]
                    try {
                        fromId = this._connections[init_url].requestId
                        // console.info("fromIds: ", fromIds)
                        // fromIds = [this._connections[init_url].requestId]
                    } catch (err) {}
                    // console.warn(fromId, url_req, init_url)
                    statements = [{
                        url: init_url,
                        fromId: fromId,
                        // from: init_url,
                        // directive: scriptLine,
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

        // console.log(url_req)
        // if (url_req.includes("ui")) {
        //     console.warn(JSON.stringify(statements))
        // }
        return statements
        // return {scriptLine: scriptLine, caution: caution}
    }

    async getScriptContentbyId (frame) {
        let scriptId = frame.scriptId
        const { Debugger } = this._cdpclient

        try {
            let content = await Debugger.getScriptSource({scriptId: scriptId})
            content = content.scriptSource.split(/\r\n|\r|\n/)
            let scriptLine = content[frame.lineNumber]
            let caution = undefined
            if (frame.lineNumber === 0) {
                caution = "[!] The lineNumber 0 might mean a failure of getting information."
            }
            return {
                directive: scriptLine,
                caution: caution,
                lineNumber: frame.lineNumber,
                columnNumber: frame.columnNumber
            }
        } catch (err) {
            return {
                directive: undefined,
                caution: "[!] An errror occured..."
            }
        }
    }

    async getRespbodyByUrl (url) {
        // let connections = getConnections()
        const { Network } = this._cdpclient
        const requestId = this._connections[url].requestId
        if (requestId === undefined) {
            throw new Error(`[*] Error: The requestID of the initial connection is not prepared`)
        }

        try {
            const content = await Network.getResponseBody({requestId: requestId})
            this._connections[url]["content"] = content.body
            return content.body
        } catch (err) {
            console.warn(err)
        }
    }

    static reformatObjForViz (rsrcInfo) {
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
            // type: rsrcInfo.type
        }

        return Object.assign(rsrcInfo, addedProps)
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
    // wsPort: wsPort
}
