import { CustomEvents } from './customEvents';

declare var d3: any;

export class UiActionsService {
    pdbId: string;
    static pdbevents: any = CustomEvents.create(['PDB.RNA.viewer.click', 'PDB.RNA.viewer.mouseover', 'PDB.RNA.viewer.mouseout']);

    constructor(pdbId: string) {
        this.pdbId = pdbId;
    }

    applyButtonActions() {

        const svgEle = d3.select('.rnaTopoSvg');

        // initialize SVG zoom behaviour and remove mouse wheel zoom events
        const zoom1 = d3.zoom().on('zoom', () => {
            d3.select(`.rnaTopoSvg_${this.pdbId}`).attr("transform", d3.event.transform)
            d3.select(`.rnaTopoSvgHighlight_${this.pdbId}`).attr("transform", d3.event.transform)
            d3.select(`.rnaTopoSvgSelection_${this.pdbId}`).attr("transform", d3.event.transform)
        });
        d3.select(`.rnaTopoSvg`).call(zoom1)
        .on('dblclick.zoom', null)
        .on('wheel.zoom', null)
        .on('mousewheel.zoom', null);

        // zoom-in button behaviour
        d3.select(`#rnaTopologyZoomIn-${this.pdbId}`)
        .on("click", () =>{
            d3.event.stopPropagation();
            zoom1.scaleBy(svgEle.transition().duration(300), 1.2);
        });

        // zoom-out button behaviour
        d3.select(`#rnaTopologyZoomOut-${this.pdbId}`)
        .on("click", () => {
            d3.event.stopPropagation();
            const rnaTopoSvg = d3.select(`.rnaTopoSvg_${this.pdbId}`);
            const transformValue = rnaTopoSvg._groups[0][0].getAttribute('transform');

            if(transformValue && transformValue !== '') {
                if(transformValue === null) return;
                const transformValMatch = +transformValue.match(/.+scale\((.*)\)/)[1];
                if(transformValMatch <= 1 || (transformValMatch - 0.3 <= 1)) {
                    svgEle.transition().duration(300).call(zoom1.transform, d3.zoomIdentity);
                    return;
                }
            }
            zoom1.scaleBy(d3.select(`.rnaTopoSvg`).transition().duration(300), 0.8);
        });

        // reset button behaviour
        d3.select(`#rnaTopologyReset-${this.pdbId}`)
        .on("click", () => {
            d3.event.stopPropagation();
            svgEle.transition().duration(300).call(zoom1.transform, d3.zoomIdentity);
        });

        // selection and highlight reset on canvas click
        d3.select(`.pdb-rna-view-container-${this.pdbId}`)
        .on("click", () => {
            d3.event.stopPropagation();
            UiActionsService.clearHighlight(this.pdbId);
            UiActionsService.clearSelection(this.pdbId);
        });

    }

    static selectPath(event: MouseEvent, pdbId: string, label_seq_id: number, residue: string, eventType: 'click' | 'mouseover', isUnobserved: boolean, color?: string): void {
        event.stopImmediatePropagation();
        this.clearHighlight(pdbId);
        this.colorPath(pdbId, label_seq_id, color, 'highlight');
        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltip`);
        ttEle!.style.display = 'inline';
        ttEle!.innerHTML = `<strong>${isUnobserved ? 'Unobserved ' : ''}Residue ${residue} ${label_seq_id}</strong>`;

        if(!isUnobserved) {
            const eventName: any = (eventType === 'click') ? 'PDB.RNA.viewer.click' : 'PDB.RNA.viewer.mouseover';
            const evData = { pdbId, label_seq_id }
            const pathElement: any = document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`);
            CustomEvents.dispatchCustomEvent(this.pdbevents[eventName], evData, pathElement);
        }

    }

    static unSelectPath(event: any, pdbId: string, label_seq_id: number, isUnobserved: boolean, color?: string): void {
        event.stopImmediatePropagation();
        this.clearHighlight(pdbId);
        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltip`);
        ttEle!.style.display = 'none';

        if(!isUnobserved) {
            const evData = { pdbId, label_seq_id }
            const pathElement: any = document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`);
            CustomEvents.dispatchCustomEvent(this.pdbevents['PDB.RNA.viewer.mouseout'], evData, pathElement);
        }
    }

    static colorPath(pdbId: string, label_seq_id: number, color?: string, type?: 'selection' | 'highlight') {
        const pathElement: any = document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`);
        const pathEleDim = pathElement.getAttribute('d');
        const pathEleStrokeWidth = parseInt(pathElement.getAttribute('stroke-width'));

        let strokeColor = color || 'orange';
        const svgClassPrefix = (type === 'highlight') ? 'rnaTopoSvgHighlight' : 'rnaTopoSvgSelection';
        const highlightSvg = document.querySelector(`.${svgClassPrefix}_${pdbId}`);
        const newPathEle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        newPathEle.setAttribute('stroke-width', (pathEleStrokeWidth * 3).toString());
        newPathEle.setAttribute('stroke', strokeColor);
        newPathEle.setAttribute('d', pathEleDim);
        highlightSvg!.appendChild(newPathEle);
    }

    static clearHighlight(pdbId: string) {
        document.querySelector(`.rnaTopoSvgHighlight_${pdbId}`)!.innerHTML = "";
    }

    static clearSelection(pdbId: string) {
        document.querySelector(`.rnaTopoSvgSelection_${pdbId}`)!.innerHTML = "";
    }

}

(window as any).UiActionsService = UiActionsService;