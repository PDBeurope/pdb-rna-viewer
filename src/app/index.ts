import { DataService, PluginOptions, ApiData } from './data';
import { UiTemplateService } from './uiTemplate';
import { UiActionsService } from './uiActions'
import { CustomEvents } from './customEvents';

class PdbRnaViewerPlugin {

    // Globals
    options: PluginOptions;
    apiData: ApiData | undefined;
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
        this.targetEle = <HTMLElement> target;

        this.uiTemplateService = new UiTemplateService(this.targetEle, this.options);
        if(this.apiData) {
            // draw topology
            this.uiTemplateService.render(this.apiData);

            // Bind to other PDB Component events
            if(this.options.subscribeEvents){
                CustomEvents.subscribeToComponentEvents(this);
            }

        } else {
            this.uiTemplateService.renderError('apiError');
        }
    }

    selectResidue(label_seq_id: number, color?: string) {
        UiActionsService.colorPath(this.options.pdbId, label_seq_id, color, 'selection');
    }

    clearSelection() {
        UiActionsService.clearSelection(this.options.pdbId);
    }

    highlightResidue(label_seq_id: number, color?: string) {
        UiActionsService.colorPath(this.options.pdbId, label_seq_id, color, 'highlight');
    }

    clearHighlight() {
        UiActionsService.clearHighlight(this.options.pdbId);
    }

}

(window as any).PdbRnaViewerPlugin = PdbRnaViewerPlugin;