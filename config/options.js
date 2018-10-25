// Options inclued from mainapp

const vizjsOption = {
    interaction: {
        zoomView: false
    },

    physics:{
        barnesHut: {
             gravitationalConstant: -10000,
            centralGravity: 0.8
        }
    },

    groups: {
        html: {
            image: "./static/html.png",
            size: 15,
            shape: "image"
        },
        css: {
            image: "./static/css.png",
            size: 15,
            shape: "image"
        },
        js: {
            image: "./static/js.png",
            size: 15,
            shape: "image"
        },
        image: {
            image: "./static/image.png",
            size: 15,
            shape: "image"
        },
        media: {
            image: "./static/media.png",
            size: 15,
            shape: "image"
        },
        font: {
            image: "./static/font.png",
            size: 15,
            shape: "image"
        },
        unknown: {
            image: "./static/unknown.png",
            size: 15,
            shape: "image"
        },
        data: {
            image: "./static/data.png",
            size: 15,
            shape: "image"
        },
    },
    // layout: {
    //     hierarchical: {
    //         direction: "LR"
    //     }
    // },
    nodes: {
        shadow: {
            enabled: true
        }
    },
    edges: {
        shadow: {
            enabled: true
        },
        smooth: {
            // type: 'curvedCW',
            type: 'diagonalCross',
            roundness: 0.3
        }
    }
}

const headersDetailTable = {
    pathname: "Path Name",  // from url parser
    host: "Host",  // from url parser
    search: "Parameters",  // from url parser
    status: "Status",
    mimeType: "MIME Type",
    // init: "Initiator",
    dataLen: "Size",
    protocol: "Protocol",  // from url parser
    subjectName: "Subject Name",
    issuer: "Issuer"
}

const wsPort = 8181


module.exports = {
    vizjsOption: vizjsOption,
    headersDetailTable: headersDetailTable,
    wsPort: wsPort
}
