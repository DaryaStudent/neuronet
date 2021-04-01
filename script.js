
function equivalentFunction(x = 0, isPr = false) {
    if (!isPr) {
        //y = x
        return x;
    } else {
        //y = 1;
        return -1;
    }
}
function logicFunction(x = 0, isPr = false) {
    if (!isPr) {
        return 1/(1+Math.exp(-x));
    } else {
        //y = f(x)(1-f(x));
        let fx=logicFunction(x);
        return fx*(1-fx);
    }
}
function softsignFunction(x = 0, isPr = false) {
    if (!isPr) {
        return x/(1+Math.abs(x));
    } else {
        //y = 1/((1+|x|)^2);
        return 1/( (1+Math.abs(x)) * (1+Math.abs(x)) );
    }
}

function getCoords(elem) {
    let box = elem.getBoundingClientRect();

    return {
        top: box.top + pageYOffset,
        left: box.left + pageXOffset -7,
        bottom: box.bottom + pageXOffset,
        right: box.right + pageXOffset -8,
        centerX: ((box.left + pageYOffset) + (box.right + pageYOffset)) / 2,
        centerY: ((box.top + pageYOffset) + (box.bottom + pageYOffset)) / 2 - 8
    };

}
function createMessageUnder(elem, html, id) {
    let message = document.createElement('div');
    message.style.cssText = "position:absolute; color: black";

    let coords = getCoords(elem);

    message.style.left = coords.centerX-10 + "px";
    message.style.top = coords.centerY + "px";

    message.innerHTML = html;
    message.style.fontSize = '13px'
    message.id = 'weight'+id;
    message.style.display = 'none';
    message.style.zIndex = '3';

    document.getElementById('field').appendChild( message);
}


class Neuronet {

    constructor(inputNeuronsCnt, outputNeuronsCnt, ...hiddenLayersNeuronsCnt) {
        this.inputNeuronsCnt = inputNeuronsCnt;
        this.outputNeuronsCnt = outputNeuronsCnt;
        this.hiddenLayersNeuronsCnt = hiddenLayersNeuronsCnt[0];
        this.activationFunction = logicFunction;
        this.educNumb = 0.1;

        this.inputLayer = new Layer();
        this.inputLayer.setActivationFunction(equivalentFunction);
        this.inputLayer.addNeurons(this.inputNeuronsCnt)
        this.inputLayer.addDisplacementNeurone();

        this.hidenLayers = [];
        if (this.hiddenLayersNeuronsCnt !== undefined) {
            for (let i = 0; i < this.hiddenLayersNeuronsCnt.length; i++) {
                let currLayer = new Layer();
                currLayer.setActivationFunction(logicFunction);
                currLayer.addNeurons(this.hiddenLayersNeuronsCnt[i])
                currLayer.addDisplacementNeurone();
                this.hidenLayers.push(currLayer);
            }
        } else {
            this.hiddenLayersNeuronsCnt = 0;
        }

        this.outputLayer = new Layer();
        this.outputLayer.setActivationFunction(logicFunction);
        this.outputLayer.addNeurons(this.outputNeuronsCnt)

        this.connectLayers();
    }

    setActivationFunction(actFunc) {
        this.activationFunction = actFunc;
    }

    connectLayers() {
        if (this.hidenLayers.length > 0) {
            let firstHiddenLayer = this.hidenLayers[0];
            let lastHiddenLayer = this.hidenLayers[this.hidenLayers.length - 1];
            this.inputLayer.connectNextLayer(firstHiddenLayer);
            this.outputLayer.connectPrevLayer(lastHiddenLayer);
            if (this.hidenLayers.length > 1) {
                for (let i = 1; i < this.hidenLayers.length; i++) {
                    this.hidenLayers[i].connectPrevLayer(this.hidenLayers[i-1])
                }
            }
        } else {
            this.inputLayer.connectNextLayer(this.outputLayer);
        }
    }

    setInput(inputData) {
        for (let i = 0; i < inputData.length; i++) {
            this.inputLayer.neurons[i].resetInputs();
            if (!this.inputLayer.neurons[i].isDisplacement) {
                this.inputLayer.neurons[i].addInput(inputData[i]);
            }
        }
    }

    goForward() {
        let curLayer = this.inputLayer;
        while(curLayer.nextLayer) {
            curLayer.calcOutput();
            curLayer.outputToNextLayer();
            curLayer = curLayer.nextLayer;
        }
        curLayer.calcOutput();
    }

    goBackward(ideal) {
        this.calcOutputLayerErrors(ideal);
        this.calcLayersErrors(this.outputLayer.prevLayer);
        this.correctWeights();
    }

    correctWeights() {
        let curLayer = this.inputLayer;
        while (curLayer) {
            let neurons = curLayer.neurons
            for (let i = 0; i < neurons.length; i++) {
                let neuron = neurons[i];
                for (let j = 0; j < neuron.outputConnections.length; j++) {
                    let connection = neuron.outputConnections[j];
                    connection.weight +=
                        this.educNumb *
                        connection.outputNeuron.error *
                        connection.outputNeuron.activationFunction(connection.outputNeuron.input, true) *
                        neuron.output
                }
            }
            curLayer = curLayer.nextLayer;
        }
    }

    calcOutputLayerErrors(ideal){
        let neurons = this.outputLayer.neurons
        for (let i = 0; i < neurons.length; i++) {
            //if (neurons[i].isDisplacement) {
                neurons[i].error = - neurons[i].output + ideal[i];
            //}
        }
    }

    calcLayersErrors(layer) {
        let curLayer = layer;
        while (curLayer) {
            let neurons = curLayer.neurons
            for (let i = 0; i < neurons.length; i++) {
                let neuron = neurons[i];
                let neuroneError = 0;
                for (let j = 0; j < neuron.outputConnections.length; j++) {
                    // console.log(
                    //     neuron.id,
                    //     ' : ',
                    //     neuron.outputConnections[j].weight,
                    //     ' * ',
                    //     neuron.outputConnections[j].outputNeuron.error,
                    //     ' = ',
                    //     neuron.outputConnections[j].weight * neuron.outputConnections[j].outputNeuron.error
                    // )
                    neuroneError += neuron.outputConnections[j].weight * neuron.outputConnections[j].outputNeuron.error;
                }
                neurons[i].error = neuroneError;
            }
            curLayer = curLayer.prevLayer;
        }
    }
}

class Layer {

    constructor() {
        this.neurons = [];
        this.prevLayer = undefined;
        this.nextLayer = undefined;
        this.activationFunction = ()=>{return -1043;}
    }

    calcOutput() {
        for (let i = 0; i < this.neurons.length; i++) {
            this.neurons[i].calcOutput();
        }
    }

    outputToNextLayer() {
        for (let i = 0; i < this.nextLayer.neurons.length; i++) {
            this.nextLayer.neurons[i].resetInputs();
        }
        for (let i = 0; i < this.neurons.length; i++) {
            let curNeurone = this.neurons[i];
            for (let j = 0; j < curNeurone.outputConnections.length; j++) {
                curNeurone.outputConnections[j].work();
            }
        }
    }

    connectPrevLayer (prevLayer) {
        this.prevLayer = prevLayer;
        prevLayer.nextLayer = this;
        for (let i = 0; i < this.neurons.length; i++) {
            for (let j = 0; j < prevLayer.neurons.length; j++) {
                this.neurons[i].connectParent(prevLayer.neurons[j]);
            }
        }
    }

    connectNextLayer (nextLayer) {
        this.nextLayer = nextLayer;
        nextLayer.prevLayer = this;
        for (let i = 0; i < this.neurons.length; i++) {
            for (let j = 0; j < nextLayer.neurons.length; j++) {
                this.neurons[i].connectChild(nextLayer.neurons[j]);
            }
        }
    }

    addNeurons(neuronCnt) {
        for (let i = 0; i < neuronCnt; i++){
            let neuron = new Neurone();
            neuron.setActivationFunction(this.activationFunction);
            this.neurons.push(neuron);
        }
    }

    setActivationFunction(activationFunction) {
        this.activationFunction = activationFunction;
    }

    addDisplacementNeurone(){
        let displacementNeurone = new Neurone(true);
        this.neurons.push(displacementNeurone);
    }
}

class Neurone {

    static nextid = 0;

    constructor(isDisplacement = false) {
        this.isDisplacement = isDisplacement;
        this.id = Neurone.nextid++;
        this.error = undefined;
        this.inputs = isDisplacement ? undefined : [];
        this.input = undefined;
        this.output = isDisplacement ? 1 : undefined;
        this.outputConnections = [];
        this.inputConnections = isDisplacement ? undefined : [];
        this.activationFunction = ()=>{
            return -1044;
        };
    }

    addInput(data) {
        this.inputs.push(data);
    }

    resetInputs() {
        this.inputs = [];
    }

    getOutput() {
        return this.output;
    }

    setActivationFunction(activationFunction) {
        this.activationFunction = activationFunction;
    }

    connectChild(childNeurone) {
        if (!childNeurone.isDisplacement) {
            let connection = new Connection(this, childNeurone);
            this.outputConnections.push(connection);
            childNeurone.inputConnections.push(connection);
        }
    }

    connectParent(parentNeurone) {
        if (!this.isDisplacement) {
            let connection = new Connection(parentNeurone, this);
            parentNeurone.outputConnections.push(connection);
            this.inputConnections.push(connection);
        }
    }

    calcOutput() {
        if (!this.isDisplacement) {
            this.input = 0;
            for (let i = 0; i < this.inputs.length; i++) {
                this.input += this.inputs[i];
            }
            this.output = this.activationFunction(this.input);
        }
    }
}

class Connection {

    constructor(inputNeuron, outputNeuron) {
        this.weight = ((Math.random()*0.3-0.15));
        this.inputNeuron = inputNeuron;
        this.outputNeuron = outputNeuron;
    }

    work() {
        this.outputNeuron.addInput(this.inputNeuron.getOutput() * this.weight)
    }

    // correct(deltaError) {
    //     this.weight = this.weight;
    // }
}



class Renderer {

    renderNeuronet(neuronet) {

        if(document.getElementById('field'))
        document.getElementById('field').remove();

        this.svgLayout = document.getElementById('svg');
        let myNode = this.svgLayout
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }

        this.neuronet = neuronet;
        this.neuronetLayout = document.createElement('div');

        this.neuronetLayout.onclick = function (event) {
            let inputRand = Math.floor(Math.random()*taskCnt);
            neuronet.setInput(mytask);
            neuronet.goForward();
            renderer.renderNeuronet(neuronet);
            console.log(neuronet.inputLayer.neurons[0])
            console.log(neuronet.outputLayer.neurons[0])
            console.log('---------------------------')
        }

        this.neuronetLayout.style.height = '900px'
        this.neuronetLayout.style.width = '1800px'
        this.neuronetLayout.style.backgroundColor = '#d7d7d7';
        this.neuronetLayout.style.display = 'flex';
        this.neuronetLayout.id = 'field';
        document.body.appendChild(this.neuronetLayout);
        this.renderLayers();
    }

    renderLayers() {
        let curLayer = this.neuronet.inputLayer;
        do {
            this.renderLayer(curLayer);
            curLayer = curLayer.nextLayer;
        } while (curLayer)
    }

    renderLayer(layer) {
        let layerLayout = document.createElement('div');
        layerLayout.style.backgroundColor = "#d3d6c0";
        layerLayout.style.border = "1px solid black";
        layerLayout.style.width = "60px";
        layerLayout.style.height = "530px";
        layerLayout.style.margin = "30px";
        layerLayout.style.display = 'flex';
        layerLayout.style.flexDirection = 'column';
        layerLayout.style.justifyContent = 'center';
        layerLayout.style.alignItems = 'center';
        //layerLayout.style.position = "relative";
        //layerLayout.style.top = '30px';
        //layerLayout.style.left = '30px';
        this.curLayerLayout = layerLayout;
        this.neuronetLayout.appendChild(layerLayout);
        this.renderNeurones(layer);
    }

    renderNeurones(layer) {
        for (let i = 0; i < layer.neurons.length; i++) {
            this.renderNeurone(layer.neurons[i]);
        }
        for (let i = 0; i < layer.neurons.length; i++) {
            this.renderConnections(layer.neurons[i]);
        }
        for (let i = 0; i < layer.neurons.length; i++) {
            this.renderNeuroneError(layer.neurons[i]);
        }
    }

    renderNeurone(neurone) {
        let neuroneLayout = document.createElement('div');
        if (neurone.isDisplacement) {
            neuroneLayout.style.backgroundColor = "#aaac9a";
        } else {
            neuroneLayout.style.backgroundColor = "#d3d6c0";
        }
        neuroneLayout.style.border = "1px solid black";
        neuroneLayout.style.width = "35px";
        neuroneLayout.style.height = "35px";
        neuroneLayout.style.margin = "5px";
        neuroneLayout.style.textAlign = "center";
        neuroneLayout.style.lineHeight = "33px";
        neuroneLayout.style.position = "relative";
        neuroneLayout.style.zIndex = "2";
        neuroneLayout.innerHTML = Math.floor(neurone.output * 100) / 100;
        neuroneLayout.style.fontSize = '8px';
        neuroneLayout.id = 'neurone' + neurone.id;
        neuroneLayout.onmouseover = function(event) {
            let id = (event.target.id).slice(7);
            let weightLabels = document.querySelectorAll('#weight'+id);
            let lines = document.querySelectorAll('#line'+id);
            for (let label of weightLabels) {
                label.style.display = 'block';
            }
            for (let line of lines) {
                line.setAttributeNS (null,'stroke', 'green');
            }
        }
        neuroneLayout.onmouseout = function(event) {
            let id = (event.target.id).slice(7);
            let weightLabels = document.querySelectorAll('#weight'+id);
            let lines = document.querySelectorAll('#line'+id);
            for (let label of weightLabels) {
                label.style.display = 'none';
            }
            for (let line of lines) {
                line.setAttributeNS (null,'stroke', 'yellow');
            }
        }
        this.curLayerLayout.appendChild(neuroneLayout);

    }

    renderConnections(neurone) {
        if (!neurone.isDisplacement){
            for (let i = 0; i < neurone.inputConnections.length; i++) {
                this.renderConnection(neurone.inputConnections[i]);
            }
        }
    }

    renderConnection(connection) {
        let startCoords = getCoords(document.getElementById('neurone' + connection.inputNeuron.id));
        let endCoords = getCoords(document.getElementById('neurone' + connection.outputNeuron.id));

        let svgNS = "http://www.w3.org/2000/svg";
        let lineLayout = document.createElementNS(svgNS,'line');
        lineLayout.setAttributeNS (null,'x1', (startCoords.right).toString());
        lineLayout.setAttributeNS (null,'y1', (startCoords.centerY).toString());
        lineLayout.setAttributeNS (null,'x2', (endCoords.left).toString());
        lineLayout.setAttributeNS (null,'y2', (endCoords.centerY).toString());
        lineLayout.setAttributeNS (null,'stroke', 'yellow');
        lineLayout.setAttributeNS (null,'stroke-width', '1')
        lineLayout.id = 'line'+connection.inputNeuron.id;
        lineLayout.onmouseover = function(event) {
            let id = (event.target.id).slice(4);
            let weightLabels = document.querySelectorAll('#weight'+id);
            let lines = document.querySelectorAll('#line'+id);
            for (let label of weightLabels) {
                label.style.display = 'block';
            }
            for (let line of lines) {
                line.setAttributeNS (null,'stroke', 'green');
            }
        }
        lineLayout.onmouseout = function(event) {
            let id = (event.target.id).slice(4);
            let weightLabels = document.querySelectorAll('#weight'+id);
            let lines = document.querySelectorAll('#line'+id);
            for (let label of weightLabels) {
                label.style.display = 'none';
            }
            for (let line of lines) {
                line.setAttributeNS (null,'stroke', 'yellow');
            }
        }
        this.svgLayout.appendChild(lineLayout);
        createMessageUnder(lineLayout, Math.floor(connection.weight * 100) / 100, connection.inputNeuron.id)
    }

    renderNeuroneError(neurone) {
        createMessageUnder(document.getElementById('neurone' + neurone.id), Math.floor(neurone.error * 100) / 100, neurone.id)
    }
}

let taskCnt = 11;
let tasks = [
    [1,1,1, 0,0,0, 0,0,0],
    [0,0,0, 1,1,1, 0,0,0],
    [0,0,0, 0,0,0, 1,1,1],

    [1,0,0, 1,0,0, 1,0,0],
    [0,1,0, 0,1,0, 0,1,0],
    [0,0,1, 0,0,1, 0,0,1],

    [1,1,1, 1,0,0, 1,0,0],
    [1,1,1, 0,1,0, 0,1,0],
    [1,1,1, 0,0,1, 0,0,1],

    [1,0,0, 1,1,1, 1,0,0],
    [1,1,0, 0,0,1, 0,0,1],
]

let answers = [
    [1, 0],
    [1, 0],
    [1, 0],

    [0, 1],
    [0, 1],
    [0, 1],

    [1, 1],
    [1, 1],
    [1, 1],

    [1, 1],
    [0, 0],
]
taskCnt = 9;
tasks = [
    [0,0,0,0,0],
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,1],
    [1,0,0,0,0],

    [1,0,1,0,1],
    [1,1,1,0,0],
    [1,0,1,1,1],
    [1,1,1,1,1],
]

answers = [
    [1,0],
    [1,0],
    [1,0],
    [1,0],
    [1,0],

    [0,1],
    [0,1],
    [0,1],
    [0,1],
]

let mytask = [0,0,1,1,1];

neuronet = new Neuronet(5,2, [4,3] );
neuronet.setActivationFunction(equivalentFunction);

renderer = new Renderer();

let i = 0;
while(i < 100000) {
    let inputRand = Math.floor(Math.random()*taskCnt);
    neuronet.setInput(tasks[inputRand]);
    neuronet.goForward();
    neuronet.goBackward(answers[inputRand]);
    i++;
}


console.log(neuronet)
renderer.renderNeuronet(neuronet)
