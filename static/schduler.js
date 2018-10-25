// Ref - https://qiita.com/RikutoYamaguchi/items/216d448871fb47a36ffa

class ScheduledTasks {

    constructor() {
        this.tasks = []
        this.messages = []

        this.isStarted = false
    }

    pushTask (task) {
        if (typeof task === "function")
            this.tasks.push(task)
    }

    pushMessage (message) {
        this.messages.push(message)
    }

    startTasks () {
        if (this.isStarted) {
            return
        }

        this.pushTask(() => {
            this.tasks = []
            this.isStarted = false
        })

        this.isStarted = true
        // return this.tasks.reduce((prevTask, next) => {
        this.tasks.reduce((prevTask, next) => {
            return prevTask
                .then(next)
                .then(msg => {
                    if (msg) {
                        this.pushMessage(msg)
                    }
                    return Promise.resolve()
                })
                .catch((err) => {
                    return Promise.reject(err)
                })
        }, Promise.resolve())

        // this.tasks = []
        // this.isStarted = false

        return
    }
}


class VisjsTaskQueue extends ScheduledTasks {

    constructor () {
        super()
        this.cbs = {}
    }

    addNode (node, nodes) {
        this.pushTask(() => {
            return new Promise((resolve, reject) => {
                this.cbs[node.id] = () => {
                    nodes.off("add", this.cbs[node.id])
                    resolve(node.id)
                }
                // console.log("on: ", node.id)
                nodes.on("add", this.cbs[node.id])
                try {
                    nodes.add(node)
                } catch (err) {
                    resolve()
                    // reject()
                }
            })
        })
    }

    addEdge (edge, edges) {
        this.pushTask(() => {
            return new Promise((resolve, reject) => {
                this.cbs[edge.id] = () => {
                    edges.off("add", this.cbs[edge.id])
                    resolve(edge.id)
                }
                edges.on("add", this.cbs[edge.id])
                try {
                    edges.add(edge)
                } catch (err) {
                    resolve()
                }
            })
        })
    }

    updateNode (node, nodes) {
        this.pushTask(() => {
            return new Promise((resolve, reject) => {
                this.cbs[node.id] = () => {
                    nodes.off("update", this.cbs[node.id])
                    resolve(node.id)
                }
                nodes.on("update", this.cbs[node.id])
                try {
                    nodes.update(node)
                } catch (err) {
                    resolve()
                }
            })
        })
    }

    // _addNode (resolve, node, nodes) {
    //     console.log(JSON.stringify(node))
    //     nodes.off(this)
    //     resolve(node.id)
    // }

}

// module.exports = {
//     VisjsTaskQueue: VisjsTaskQueue
// }
