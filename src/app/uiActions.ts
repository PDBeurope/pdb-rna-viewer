import { CustomEvents } from './customEvents';

declare var d3: any;
export class UiActionsService {
    pdbId: string;
    static pdbevents: any = CustomEvents.create(['PDB.RNA.viewer.click', 'PDB.RNA.viewer.mouseover', 'PDB.RNA.viewer.mouseout']);
    private static lastSelected: number = -1
    private static selected: number = -1
    private static selectedColor: string = ''
    private static fillColor: string = ''
    private static expanded: boolean = false
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

    static selectNucleotide = function(pdbId: string, entityId: string, label_seq_id: number, eventType: 'click' | 'mouseover', isUnobserved: boolean, residue?: string, event?: MouseEvent, color?: string): void {
        event?.stopImmediatePropagation();
        UiActionsService.clearHighlight(pdbId);
        UiActionsService.colorNucleotide(pdbId, label_seq_id, color, 'highlight');
        UiActionsService.selected = label_seq_id;
        UiActionsService.lastSelected = label_seq_id;
        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltip`);
        ttEle!.style.display = 'inline';
        ttEle!.innerHTML = `<strong>${isUnobserved ? 'Unobserved ' : ''}Residue ${residue ? residue : ''} ${label_seq_id}</strong>`;

        if(!isUnobserved) {
            const eventName: any = (eventType === 'click') ? 'PDB.RNA.viewer.click' : 'PDB.RNA.viewer.mouseover';
            const evData = { pdbId, label_seq_id, entityId }
            const textElement: any = document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`);
            CustomEvents.dispatchCustomEvent(UiActionsService.pdbevents[eventName], evData, textElement);
        }

    }

    static unSelectNucleotide(pdbId: string, entityId: string, label_seq_id: number, isUnobserved: boolean, event?: any, color?: string): void {
        event?.stopImmediatePropagation();
        this.clearHighlight(pdbId);
        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltip`);
        ttEle!.style.display = 'none';

        if(!isUnobserved) {
            if(label_seq_id == undefined) {
                label_seq_id = this.lastSelected;
            }
            if(label_seq_id > -1) {
                const evData = { pdbId, label_seq_id, entityId }
                const textElement: any = document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`);
                CustomEvents.dispatchCustomEvent(this.pdbevents['PDB.RNA.viewer.mouseout'], evData, textElement);
            }
        }
    }

    static colorNucleotide = function(pdbId: string, label_seq_id: number, color?: string, type?: 'selection' | 'highlight', shape?: string) {
        let strokeColor = color || 'orange';
        let nucleotide = (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(`rnaviewEle rnaviewEle_${pdbId} rnaview_${pdbId}_${label_seq_id}`)[0]
        if(nucleotide.nodeName == 'path') {
            nucleotide.setAttribute("stroke",strokeColor);
        } else if(nucleotide.nodeName == 'text'){
            nucleotide.setAttribute("fill",strokeColor);
        }      
    }
    static showCheckboxes() {
        var checkboxes = document.getElementById("checkboxes");
        if (!this.expanded) {
            checkboxes!.style.display = "block";
            this.expanded = true;
        } else {
            checkboxes!.style.display = "none";
            this.expanded = false;
        }
    }
    static clearHighlight(pdbId: string) {
        if (this.selected > -1) {
            (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(`rnaviewEle rnaviewEle_${pdbId} rnaview_${pdbId}_${this.selected}`)[0].setAttribute("fill","323232");
            this.selected = -1;
        }
    }

    static clearSelection(pdbId: string) {
        document.querySelector(`.rnaTopoSvgSelection_${pdbId}`)!.innerHTML = "";
    }

    static showTooltip(evt: any, text: string, path: string, color: string, fill: string) {
        const tooltip = document.getElementById("tooltip");
        tooltip!.id = "tooltip"
        tooltip!.innerHTML = text;
        tooltip!.style.display = "block";
        tooltip!.style.left = evt.layerX + 'px';
        tooltip!.style.top = evt.layerY + 'px'; 
        this.selectedColor = color;
        this.fillColor = fill;
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("stroke","orange");
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("fill","orange");
      }
      
    static hideTooltip(path: string) {
        var tooltip = document.getElementById("tooltip");
        tooltip!.style.display = "none";
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("stroke", `${this.selectedColor}`);
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("fill", `${this.fillColor}`);
    }
}

(window as any).UiActionsService = UiActionsService;