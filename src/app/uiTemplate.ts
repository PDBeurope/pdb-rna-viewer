import { UiActionsService } from './uiActions'
import { PluginOptions, ApiData } from './data';

export class UiTemplateService {
    private containerElement: HTMLElement;
    private pluginOptions: PluginOptions;
    private uiActionsService: UiActionsService;

    constructor(containerElement: HTMLElement, pluginOptions: PluginOptions) {
        this.containerElement = containerElement;
        this.pluginOptions = pluginOptions;
        this.uiActionsService = new UiActionsService(this.pluginOptions.pdbId);
    }

    render(apiData: ApiData) {
        this.containerElement.innerHTML = `<div class="pdb-rna-view-container pdb-rna-view-container-${this.pluginOptions.pdbId}">
            ${this.svgTemplate(apiData)}
            ${this.title()}
            ${this.tooltip()}
            ${this.actionButtons()}
        </div>`;
        
        this.uiActionsService.applyButtonActions();
    }

    private svgTemplate(apiData: ApiData): string {
        let pathStrs: string[] = [];
        const lastPathIndex = apiData.svg_paths.length - 1;
        apiData.svg_paths.forEach((pathStr: string, recordIndex: number) => {
            if(recordIndex === 0 || recordIndex === lastPathIndex) return;
            const pathEleClass = `rnaviewEle rnaviewEle_${this.pluginOptions.pdbId} rnaview_${this.pluginOptions.pdbId}_${apiData.label_seq_ids[recordIndex]}`;
            const strokeWide = this.pluginOptions.theme?.strokeWidth || '2';
            let strokeColor = this.pluginOptions.theme?.color || '#323232';
            let isUnobserved = false;
            if(apiData.unobserved_label_seq_ids && apiData.unobserved_label_seq_ids.indexOf(apiData.label_seq_ids[recordIndex]) > -1) {
                strokeColor = this.pluginOptions.theme?.unobservedColor || '#ccc';
                isUnobserved = true;
            }

            pathStrs.push(`<path 
                class="${pathEleClass}" stroke-width="${strokeWide}" stroke="${strokeColor}" d="${pathStr}" 
                data-stroke-color="${strokeColor}" 
                onclick="UiActionsService.selectPath(event, '${this.pluginOptions.pdbId}', ${apiData.label_seq_ids[recordIndex]}, '${apiData.sequence[recordIndex - 1]}', 'click', ${isUnobserved}, ${this.pluginOptions.theme?.highlightColor ? "'"+this.pluginOptions.theme.highlightColor+"'" : undefined})" 
                onmouseover="UiActionsService.selectPath(event, '${this.pluginOptions.pdbId}', ${apiData.label_seq_ids[recordIndex]}, '${apiData.sequence[recordIndex - 1]}', 'mouseover', ${isUnobserved}, ${this.pluginOptions.theme?.highlightColor ? "'"+this.pluginOptions.theme.highlightColor+"'" : undefined})" 
                onmouseout="UiActionsService.unSelectPath(event, '${this.pluginOptions.pdbId}', ${apiData.label_seq_ids[recordIndex]}, ${isUnobserved}, '${strokeColor}')">
            </path>`)
        });

        return `
        <div style="width:100%;height:100%;z-index:0;position:absolute;">
            <svg class="rnaTopoSvgSelection rnaTopoSvgSelection_${this.pluginOptions.pdbId}" 
            preserveAspectRatio="xMidYMid meet" 
            viewBox="0 0 ${apiData.dimensions.width} ${apiData.dimensions.height}" 
            style="width:100%;height:100%;position:relative;"></svg>
        </div>
        <div style="width:100%;height:100%;z-index:1;position:absolute;">
            <svg class="rnaTopoSvgHighlight rnaTopoSvgHighlight_${this.pluginOptions.pdbId}" 
            preserveAspectRatio="xMidYMid meet" 
            viewBox="0 0 ${apiData.dimensions.width} ${apiData.dimensions.height}" 
            style="width:100%;height:100%;position:relative;"></svg>
        </div>
        <div style="width:100%;height:100%;z-index:2;position:absolute;">
            <svg class="rnaTopoSvg rnaTopoSvg_${this.pluginOptions.pdbId}" 
                preserveAspectRatio="xMidYMid meet" 
                viewBox="0 0 ${apiData.dimensions.width} ${apiData.dimensions.height}" 
                style="width:100%;height:100%;">${pathStrs.join('')}
            </svg>
        </div>`;
    }

    private title(): string {
        return  `<span class="pdb-rna-view-title">${this.pluginOptions.pdbId.toUpperCase()} Chain ${this.pluginOptions.chainId}</span>`;
    }

    private tooltip(): string {
        return  `<span class="pdb-rna-view-tooltip" id="${this.pluginOptions.pdbId}-rnaTopologyTooltip"></span>`;
    }

    private actionButtons(): string {
        return  `<div class="pdb-rna-view-btn-group">
            <span class="pdb-rna-view-btn" title="Zoom-in" id="rnaTopologyZoomIn-${this.pluginOptions.pdbId}">
                <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z" />
                </svg>
            </span>
            
            <span class="pdb-rna-view-btn" title="Zoom-out" id="rnaTopologyZoomOut-${this.pluginOptions.pdbId}">
                <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7,14 5,12 5,9.5C5,7 7,5 9.5,5C12,5 14,7 14,9.5C14,12 12,14 9.5,14M7,9H12V10H7V9Z" />
                </svg>
            </span>

            <span class="pdb-rna-view-btn" title="Reset" id="rnaTopologyReset-${this.pluginOptions.pdbId}">
                <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z" />
                </svg>
            </span>
        </div>`;
    }

    renderError(type?: string) {
        let errorContent = `<div class="pdb-rna-view-error">Error! Something went wrong!</div>`;
        if(type === 'apiError') {
            errorContent = `<div class="pdb-rna-view-error">
                RNA topology data for ${this.pluginOptions.pdbId.toUpperCase()} | ${this.pluginOptions.entityId} | ${this.pluginOptions.chainId.toUpperCase()} is not available!
            </div>`;
        }

        this.containerElement.innerHTML = `<div class="pdb-rna-view-container">${errorContent}</div>`;
    }
}