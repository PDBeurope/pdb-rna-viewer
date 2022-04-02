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
        this.apiData = await this.dataService.getApiData(this.options.entityId, this.options.chainId, this.options.pdbId);
        this.FR3DData = await this.dataService.getFR3DData(this.options.pdbId, this.options.chainId);
        this.FR3DNestedData = await this.dataService.getFR3DNestedData(this.options.pdbId, this.options.chainId);
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

    selectResidue(label_seq_id: number, color?: string) {
        UiActionsService.selectNucleotide(this.options.pdbId, this.options.entityId, label_seq_id, 'mouseover', false, color);
    }

    clearSelection(label_seq_id: number) {
        UiActionsService.unSelectNucleotide(this.options.pdbId, this.options.entityId, label_seq_id, false);
    }

    highlightResidue(label_seq_id: number, color?: string) {
        UiActionsService.colorNucleotide(this.options.pdbId, label_seq_id, color, 'highlight');
    }

    clearHighlight() {
        UiActionsService.clearHighlight(this.options.pdbId);
    }
}

(window as any).PdbRnaViewerPlugin = PdbRnaViewerPlugin;
