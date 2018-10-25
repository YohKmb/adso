// Ref - https://qiita.com/RikutoYamaguchi/items/216d448871fb47a36ffa

class ScheduledTasks {

    constructor() {
        this.tasks = []
        this.messages = []
    }

    pushTask (task) {
        if (typeof task === "function")
            this.tasks.push(task)
    }

    pushMessage (message) {
        this.messages.push(message)
    }

    startTasks () {
        return this.tasks.reduce((prevTask, next) => {
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
    }
}

class VisjsTaskQueue extends Tasks {

    const cbs = {}

    addNode (node, nodes) {
        this.pushTask(() => {
            return new Promise((resolve, reject) => {
                this.cbs[node.id] = () => {
                    console.log(JSON.stringify(node))
                    nodes.off(this.cbs[node.id])
                    resolve(node.id)
                }
                nodes.on("add", this.cbs[node.id])
                nodes.add(node)
            })
        })
    }

    // _addNode (resolve, node, nodes) {
    //     console.log(JSON.stringify(node))
    //     nodes.off(this)
    //     resolve(node.id)
    // }

}

module.exports = {
    VisjsTaskQueue: VisjsTaskQueue
}
