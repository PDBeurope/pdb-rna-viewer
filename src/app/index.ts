import { DataService, PluginOptions, ApiData } from './data';
import { UiTemplateService } from './uiTemplate';
import { UiActionsService } from './uiActions'
import { CustomEvents } from './customEvents';

class PdbRnaViewerPlugin {

    // Globals
    options: PluginOptions;
    apiData: ApiData | undefined;
    FR3DData: any;
    FR3DNestedData: any;
    targetEle: HTMLElement;
    pdbevents: any
    dataService: DataService;
    uiTemplateService: UiTemplateService;

    constructor() {
        this.dataService = new DataService();
    }

    async render(target: HTMLElement, options: PluginOptions) {
        if(!target || !options.pdbId || !options.chainId || !options.entityId) {
            console.log('Invalid plugin input!');
            return;
        }
        this.options = options;
        this.apiData = options.apiData ?? await this.dataService.getApiData(this.options.entityId, this.options.chainId, this.options.pdbId);
        this.FR3DData = options.FR3DData ?? await this.dataService.getFR3DData(this.options.pdbId, this.options.chainId);
        this.FR3DNestedData = this.filterNestedData(this.FR3DData);
        this.targetEle = <HTMLElement> target;

        this.uiTemplateService = new UiTemplateService(this.targetEle, this.options, this.apiData);
        if(this.apiData) {
            // draw topology
            this.uiTemplateService.render(this.apiData, this.FR3DData, this.FR3DNestedData);

            // Bind to other PDB Component events
            if(this.options.subscribeEvents){
                CustomEvents.subscribeToComponentEvents(this);
            }

        } else {
            this.uiTemplateService.renderError('apiError');
        }
    }

    filterNestedData(data: any) {
        const onlyNested = Object.assign({}, data);
        onlyNested.annotations = data.annotations.filter(function(annotation: any) {
            return annotation.crossing === "0";
        });
        return onlyNested;
    }

    selectResidue(label_seq_id: number, color?: string, doNotReport?: boolean) {
        UiActionsService.selectNucleotide(this.options.pdbId, this.options.entityId, label_seq_id, 'click', false, undefined, undefined, color, false, doNotReport);
    }

    selectResidueRange(start_label_seq_id: number, end_label_seq_id: number, color?: string, doNotReport?: boolean) {
        const label_seq_ids: number[] = [];
        for (let i = start_label_seq_id; i <= end_label_seq_id; i++) {
            label_seq_ids.push(i);
        }
        UiActionsService.selectNucleotide(this.options.pdbId, this.options.entityId, label_seq_ids, 'click', false, color, undefined, undefined, true, doNotReport);
    }

    clearSelection(label_seq_id: number, doNotReport?: boolean) {
        UiActionsService.unSelectNucleotide(this.options.pdbId, this.options.entityId, label_seq_id, 'click', false, undefined, undefined, doNotReport);
    }

    highlightResidue(label_seq_id: number, color?: string, doNotReport?: boolean) {
        // UiActionsService.colorNucleotide(this.options.pdbId, label_seq_id, color, 'highlight');
        UiActionsService.highlightNucleotide(this.options.pdbId, this.options.entityId, label_seq_id, false, undefined, undefined, color, doNotReport);
    }

    highlightResidueRange(start_label_seq_id: number, end_label_seq_id: number, color?: string, doNotReport?: boolean) {
        const label_seq_ids: number[] = [];
        for (let i = start_label_seq_id; i <= end_label_seq_id; i++) {
            label_seq_ids.push(i);
        }
        UiActionsService.highlightNucleotide(this.options.pdbId, this.options.entityId, label_seq_ids, false, undefined, undefined, color, doNotReport);
    }

    clearHighlight(doNotReport?: boolean) {
        // UiActionsService.clearHighlight(this.options.pdbId);
        UiActionsService.unHighlightNucleotide(this.options.pdbId, this.options.entityId, undefined, false, undefined, doNotReport);
    }
}

(window as any).PdbRnaViewerPlugin = PdbRnaViewerPlugin;
