class GraphicRenderer {

    static layout = undefined;
    static layoutHeight = 800;

    static setLayout(domElem) {
        this.layout = domElem;
        // this.layoutHeight = domElem.clientHeight;
    }

    static renderData(data) {
        //cleaning
        while (GraphicRenderer.layout.firstChild) {
            GraphicRenderer.layout.removeChild(GraphicRenderer.layout.firstChild);
        }

        //rendering
        let groups = data.groups;
        let p = Math.ceil(groups.length / 8000);
        // console.log(groups)
        // for (let group of groups) {
        //     if (!isNaN(group)) {
        //         let column = GraphicRenderer._createColumnDomElem(group / data.maxY * GraphicRenderer.layoutHeight);
        //         GraphicRenderer.layout.appendChild(column);
        //     }
        // }
        console.log(groups.length, p)
        for (let i = 0; i < groups.length; i+=p){
            if (!isNaN(groups[i])) {
                let column = GraphicRenderer._createColumnDomElem(groups[i] / data.maxY * GraphicRenderer.layoutHeight);
                GraphicRenderer.layout.appendChild(column);
            }
        }
    }

    static _createColumnDomElem(height) {
        let column = document.createElement('div');
        column.classList.add('graphicColumn');
        column.style.height = height + 'px';
        return column;
    }
}