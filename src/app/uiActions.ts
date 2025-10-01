import { CustomEvents } from './customEvents';

// import only the parts needed from d3 v5
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomBehavior, D3ZoomEvent } from 'd3-zoom';
import 'd3-transition'; // patches selections with .transition()
export class UiActionsService {
    pdbId: string;
    static pdbevents: any = CustomEvents.create(['PDB.RNA.viewer.click', 'PDB.RNA.viewer.mouseover', 'PDB.RNA.viewer.mouseout', 'PDB.RNA.viewer.deselect']);
    private static selected: Map<number, string> = new Map();
    private static highlighted: Map<number, string> = new Map();
    private static tooltipSelectedColor: string = ''
    private static fillColor: string = ''
    private static expanded: boolean = false
    private static zoomBehavior: ZoomBehavior<SVGSVGElement, null>
    private static zoomed: boolean = false;
    constructor(pdbId: string) {
        this.pdbId = pdbId;
    }

    applyButtonActions() {

        const svgEle = select<SVGSVGElement, null>('.rnaTopoSvg');
        // initialize SVG zoom behaviour and remove mouse wheel zoom events
        const zoom1: ZoomBehavior<SVGSVGElement, null> = zoom<SVGSVGElement, null>()
            .on('zoom', (event: D3ZoomEvent<SVGSVGElement, null>) => {
                // D3 v5: use global d3.event
                (select(`.rnaTopoSvg_${this.pdbId}`) as any)
                    .attr("transform", event.transform.toString());

                (select(`.rnaTopoSvgHighlight_${this.pdbId}`) as any)
                    .attr("transform", event.transform.toString());

                (select(`.rnaTopoSvgSelection_${this.pdbId}`) as any)
                    .attr("transform", event.transform.toString());
            });
        UiActionsService.zoomBehavior = zoom1;

        select<SVGSVGElement, null>(`.rnaTopoSvg`)
            .call(zoom1)
            .on('dblclick.zoom', null)
            .on('wheel.zoom', null)
            .on('mousewheel.zoom', null);

        // zoom-in button behaviour
        select(`#rnaTopologyZoomIn-${this.pdbId}`)
            .on("click", (event: MouseEvent) => {
                event.stopPropagation();
                zoom1.scaleBy(svgEle.transition().duration(300), 1.2);
            });

        // zoom-out button behaviour
        select(`#rnaTopologyZoomOut-${this.pdbId}`)
        .on("click", (event: MouseEvent) => {
            event.stopPropagation();
            const rnaTopoSvg = select<SVGSVGElement, null>(`.rnaTopoSvg_${this.pdbId}`);
            const transformValue = rnaTopoSvg.node()?.getAttribute("transform");

            if(transformValue && transformValue !== '') {
                const transformValMatch = +transformValue.match(/.+scale\((.*)\)/)![1];
                if(transformValMatch <= 1 || (transformValMatch - 0.3 <= 1)) {
                    svgEle.transition().duration(300).call(zoom1.transform, zoomIdentity);
                    return;
                }
            }
            zoom1.scaleBy(select<SVGSVGElement, null>(`.rnaTopoSvg`).transition().duration(300), 0.8);
        });

        // reset button behaviour
        select(`#rnaTopologyReset-${this.pdbId}`)
            .on("click", (event: MouseEvent) => {
                event.stopPropagation();
                svgEle.transition().duration(300).call(zoom1.transform, zoomIdentity);
            });

        // selection and highlight reset on canvas click
        select(`.pdb-rna-view-container-${this.pdbId}`)
            .on("click", (event: MouseEvent) => {
                event.stopPropagation();
                UiActionsService.clearHighlight(this.pdbId, undefined);
                UiActionsService.clearSelection(this.pdbId, undefined);

                // hard reset maps
                UiActionsService.selected.clear();
                UiActionsService.highlighted.clear();

                // hide tooltips
                const selTooltip = document.getElementById(`${this.pdbId}-rnaTopologyTooltip`);
                if (selTooltip) selTooltip.style.display = "none";

                const hlTooltip = document.getElementById(`${this.pdbId}-rnaTopologyTooltipHighlight`);
                if (hlTooltip) hlTooltip.style.display = "none";
            });

    }

    static highlightNucleotide = function(
        pdbId: string, entityId: string, label_seq_id: number[] | number,
        isUnobserved: boolean, residue?: string, event?: MouseEvent,
        color?: string, doNotReport?: boolean
    ) {
        event?.stopImmediatePropagation();
        const label_seq_ids = Array.isArray(label_seq_id) ? label_seq_id : [label_seq_id];

        UiActionsService.clearHighlight(pdbId, undefined);
        label_seq_ids.forEach(id => UiActionsService.colorNucleotide(pdbId, id, color, 'highlight'));
        
        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltipHighlight`);
        ttEle!.style.display = 'inline';
        const rangeString = UiActionsService.buildResidueLabel(label_seq_ids, residue);
        
        ttEle!.innerHTML = `<strong>${isUnobserved ? 'Unobserved ' : ''}${rangeString}</strong>`;

        if (!isUnobserved && !doNotReport) {
            label_seq_ids.forEach(id => {
                const evData = { pdbId, label_seq_id, entityId }
                const textElement: any = document.querySelector(`.rnaview_${pdbId}_${id}`);
                CustomEvents.dispatchCustomEvent(UiActionsService.pdbevents['PDB.RNA.viewer.mouseover'], evData, textElement);
            });
        }
    }

    static unHighlightNucleotide = function(
        pdbId: string, entityId: string, label_seq_id: number | undefined,
        isUnobserved: boolean, event?: MouseEvent, doNotReport?: boolean
    ) {
        event?.stopImmediatePropagation();
        const label_seq_ids = label_seq_id ? [label_seq_id] : undefined;
        UiActionsService.clearHighlight(pdbId, label_seq_ids);
        
        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltipHighlight`);
        ttEle!.style.display = 'none';

        if (!isUnobserved && !doNotReport) {
            const evData = { pdbId, label_seq_id, entityId }
            const textElement: any = label_seq_id
                ? document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`)
                : document.querySelector(`.rnaTopoSvg_${pdbId}`);
            
            CustomEvents.dispatchCustomEvent(UiActionsService.pdbevents['PDB.RNA.viewer.mouseout'], evData, textElement);
        }
    }

    static selectNucleotide = function(
        pdbId: string, entityId: string, label_seq_id: number[] | number,
        eventType: 'click' | 'mouseover', isUnobserved: boolean,
        residue?: string, event?: MouseEvent, color?: string,
        multipleSelection?: boolean, doNotReport?: boolean
    ): void {
        event?.stopImmediatePropagation();
        const ids = Array.isArray(label_seq_id) ? label_seq_id : [label_seq_id];

        const alreadySelected = ids.every(id => UiActionsService.selected.has(id));
        if (alreadySelected) {
            // Toggle off
            const newEventType = eventType === 'mouseover' ? 'mouseout' : 'click';
            UiActionsService.unSelectNucleotide(pdbId, entityId, undefined, newEventType, isUnobserved, event, color);
            return;
        }

        // Clear old selection if not multi
        if (!multipleSelection && eventType === 'click') {
            UiActionsService.clearSelection(pdbId, undefined);
            UiActionsService.clearHighlight(pdbId, undefined);
        }

        // Add to selection
        ids.forEach(id => UiActionsService.colorNucleotide(pdbId, id, color, 'selection'));

        if (eventType === 'click') UiActionsService.zoomToNucleotides(pdbId, ids);

        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltip`);
        ttEle!.style.display = 'inline';
        const rangeString = UiActionsService.buildResidueLabel(ids, residue);
        
        ttEle!.innerHTML = `<strong>${isUnobserved ? 'Unobserved ' : ''}Selected ${rangeString}</strong>`;

        if(!isUnobserved && !doNotReport) {
            ids.forEach(id => {
                const evData = { pdbId, label_seq_id: id, entityId }
                const textElement: any = document.querySelector(`.rnaview_${pdbId}_${id}`);
                CustomEvents.dispatchCustomEvent(UiActionsService.pdbevents['PDB.RNA.viewer.click'], evData, textElement);
            });
        }
    }

    static unSelectNucleotide(
        pdbId: string, entityId: string, label_seq_id: number | undefined,
        eventType: 'click' | 'mouseout', isUnobserved: boolean, event?: any,
        color?: string, doNotReport?: boolean
    ): void {
        event?.stopImmediatePropagation();
        const label_seq_ids = label_seq_id ? [label_seq_id] : undefined;
        UiActionsService.clearSelection(pdbId, label_seq_ids);
        if (eventType === 'click') UiActionsService.zoomReset();

        const ttEle = document.getElementById(`${pdbId}-rnaTopologyTooltip`);
        ttEle!.style.display = 'none';

        if(!isUnobserved && !doNotReport) {
            const evData = { pdbId, label_seq_id, entityId }
            const textElement: any = label_seq_id
                ? document.querySelector(`.rnaview_${pdbId}_${label_seq_id}`)
                : document.querySelector(`.rnaTopoSvg_${pdbId}`);
            
            CustomEvents.dispatchCustomEvent(UiActionsService.pdbevents['PDB.RNA.viewer.deselect'], evData, textElement);
        }
    }

    static colorNucleotide = function(pdbId: string, label_seq_id: number, color?: string, type?: 'selection' | 'highlight', shape?: string) {
        const nucleotide = (document.querySelector(`svg.rnaTopoSvg`) as any)
            .getElementsByClassName(
                `rnaviewEle rnaviewEle_${pdbId} rnaview_${pdbId}_${label_seq_id}`
            )[0];
        if (!nucleotide) return;

        const strokeAttr = nucleotide.nodeName === 'text' ? 'fill' : 'stroke';
        const original = nucleotide.getAttribute(strokeAttr) || '#323232';

        // Store original color so we can restore later
        if (type === 'highlight') {
            UiActionsService.highlighted.set(label_seq_id, original);
        } else if (type === 'selection') {
            UiActionsService.selected.set(label_seq_id, original);
        }

        nucleotide.setAttribute(strokeAttr, color || 'orange');
    }

    static clearNucleotides(
        pdbId: string,
        type: 'highlight' | 'selection',
        label_seq_ids: number[] | undefined
    ) {
        const map =
            type === 'highlight'
                ? UiActionsService.highlighted
                : UiActionsService.selected;

        const otherMap = type === 'highlight'
            ? UiActionsService.selected
            : UiActionsService.highlighted;

        const clearIds = label_seq_ids ?? Array.from(map.keys());

        for (const id of clearIds) {

            const originalColor = map.get(id);
            if (!originalColor) continue;

            const nucleotide = (document.querySelector(`svg.rnaTopoSvg`) as any)
                .getElementsByClassName(
                    `rnaviewEle rnaviewEle_${pdbId} rnaview_${pdbId}_${id}`
                )[0];

            if (nucleotide) {
                const strokeAttr = nucleotide.nodeName === 'text' ? 'fill' : 'stroke';

                if (otherMap.has(id) && type === 'highlight') {
                    // keep the *current* DOM color (selection or highlight still active)
                    const currentColor = nucleotide.getAttribute(strokeAttr);
                    nucleotide.setAttribute(strokeAttr, currentColor!);
                } else {
                    // revert to original
                    nucleotide.setAttribute(strokeAttr, originalColor);
                }
            }

            map.delete(id);
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

    static clearHighlight(pdbId: string, label_seq_ids: number[] | undefined) {
        UiActionsService.clearNucleotides(pdbId, 'highlight', label_seq_ids);
    }

    static clearSelection(pdbId: string, label_seq_ids: number[] | undefined) {
        document.querySelector(`.rnaTopoSvgSelection_${pdbId}`)!.innerHTML = "";
        UiActionsService.clearNucleotides(pdbId, 'selection', label_seq_ids);
    }

    static showTooltip(evt: any, text: string, path: string, color: string, fill: string) {
        const tooltip = document.getElementById("tooltip");
        tooltip!.id = "tooltip"
        tooltip!.innerHTML = text;
        tooltip!.style.display = "block";
        tooltip!.style.left = evt.layerX + 'px';
        tooltip!.style.top = evt.layerY + 'px'; 
        this.tooltipSelectedColor = color;
        this.fillColor = fill;
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("stroke","orange");
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("fill","orange");
      }
      
    static hideTooltip(path: string) {
        var tooltip = document.getElementById("tooltip");
        tooltip!.style.display = "none";
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("stroke", `${this.tooltipSelectedColor}`);
        (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(path)[0].setAttribute("fill", `${this.fillColor}`);
    }
    static zoomToNucleotides(pdbId: string, label_seq_ids: number[]) {
        const svg = select<SVGSVGElement, null>(`.rnaTopoSvg`);
        const svgNode = svg.node();
        if (!svgNode) return;

        const gNode = document.querySelector(`.rnaTopoSvg_${pdbId}`) as SVGGElement;
        if (!gNode) return;

        const doZoom = () => {
            let resHeight: number | undefined = undefined;
            let scale: number | undefined = undefined;
            let cxSum = 0;
            let cySum = 0;
            let cntNum = 0;
            const vb = svgNode.viewBox.baseVal;

            for (const label_seq_id of label_seq_ids) {
                const nucleotide = document
                    .querySelector(`.rnaview_${pdbId}_${label_seq_id}`) as SVGGraphicsElement;   
                if (!nucleotide) continue;

                const bbox = nucleotide.getBBox();
                const rect = nucleotide.getBoundingClientRect();

                if (resHeight === undefined) {
                    resHeight = rect.height;

                    const height = svgNode.clientHeight;
                    const desiredHeightPx = height * 0.05;
                    scale = desiredHeightPx / resHeight;
                }

                cxSum += bbox.x + bbox.width / 2;
                cySum += bbox.y + bbox.height / 2;
                cntNum += 1;
            }
            const cx = cxSum / cntNum;
            const cy = cySum / cntNum;

            const tx = vb.width / 2 - scale! * cx;
            const ty = vb.height / 2 - scale! * cy;

            const transform = zoomIdentity.translate(tx, ty).scale(scale!);

            svg.transition()
                .duration(500)
                .call(UiActionsService.zoomBehavior.transform, transform);
            UiActionsService.zoomed = true;
        };

        if (UiActionsService.zoomed) {
            // First reset, then chain zoom
            svg.transition()
                .duration(500)
                .call(UiActionsService.zoomBehavior.transform, zoomIdentity)
                .on("end", doZoom);
        } else {
            doZoom();
        }
    }

    static zoomReset() {
        const svg = select<SVGSVGElement, null>(`.rnaTopoSvg`);
        svg.transition()
            .duration(500)
            .call(UiActionsService.zoomBehavior.transform, zoomIdentity);
        UiActionsService.zoomed = false;
    }

    private static buildResidueLabel(ids: number[], residue?: string): string {
        if (ids.length === 0) return '';

        // Sort to be safe
        const sorted = Array.from(new Set(ids)).sort((a, b) => a - b);

        // Single residue
        if (sorted.length === 1) {
            return `Residue ${residue ? residue + ' ' : ''}${sorted[0]}`;
        }

        // Build ranges
        const ranges: string[] = [];
        let start = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === prev + 1) {
                prev = sorted[i];
            } else {
                if (start === prev) {
                    ranges.push(`${start}`);
                } else {
                    ranges.push(`${start} - ${prev}`);
                }
                start = sorted[i];
                prev = sorted[i];
            }
        }

        // Push last range
        if (start === prev) {
            ranges.push(`${start}`);
        } else {
            ranges.push(`${start} - ${prev}`);
        }

        // Join ranges
        return `Residues ${ranges.join(', ')}`;
    }
}

(window as any).UiActionsService = UiActionsService;