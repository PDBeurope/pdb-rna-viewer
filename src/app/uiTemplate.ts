import { UiActionsService } from './uiActions';
import { PluginOptions, ApiData} from './data';

export class UiTemplateService {
    private containerElement: HTMLElement;
    private pluginOptions: PluginOptions;
    private uiActionsService: UiActionsService;
    private locations: Map<any, number[]> = new Map();
    private pathStrs: string[] = [];  
    private nucleotideStrs: string[] = [];
    private baseStrs: Map <string, [boolean, string[]]> = new Map();
    private nestedBaseStrs: Map <string, [boolean, string[]]> = new Map();
    private displayBaseStrs: string;
    private displayNestedBaseStrs: string;

    menuStyle = 'position:relative;z-index:10;height:38px;line-height:38px;background-color:#696969;font-size:16px; color: #efefef;';

    constructor(containerElement: HTMLElement, pluginOptions: PluginOptions, apiData: ApiData|undefined) {
        this.containerElement = containerElement;
        this.pluginOptions = pluginOptions;
        this.uiActionsService = new UiActionsService(this.pluginOptions.pdbId);
    }

    render(apiData: ApiData, FR3DData: any, FR3DNestedData: any) {
        this.containerElement.innerHTML = 
        `<div class="pdb-rna-view-container pdb-rna-view-container-${this.pluginOptions.pdbId}">
            ${this.svgTemplate(apiData, FR3DData, FR3DNestedData)}
            ${this.title()}
            ${this.tooltip()}
            ${this.actionButtons()}
        </div>
        <div id="mainMenu" style="${this.menuStyle}">
                <img src="https://www.ebi.ac.uk/pdbe/entry/static/images/logos/PDBe/logo_T_64.png" style="height:15px; width: 15px; border:0;position:relative;margin-top: 11px;margin-left:10px;display: inline-block;" />
                <div class="menuOptions" style="display: inline-block;float:right;margin-right:20px;">
                    <form>
                        <input type="checkbox" id="nestedBP" name="nestedBP">
                        <label for="nestedBP"> Only nested BPs</label>
                        <select class="menuSelectbox" style="display:inline-block;"><option value="">Nucleotides</option></select>
                        <div class="multiselect">
                            <div class="selectBox" onclick="UiActionsService.showCheckboxes()" style="display:inline-block;">
                                <select>
                                    <option>Base Pairings</option>
                                </select>
                                <div class="overSelect"></div>
                            </div>
                            <div id="checkboxes"></div>
                        </div>
                    </form>
                </div>
        </div>
        `;
        this.createModeDropdown()
        this.createBPDropdown()
        this.uiActionsService.applyButtonActions();
    }

    private changeBP(val: string) {
        this.displayBaseStrs = '';
        this.displayNestedBaseStrs = '';
        const allBP = this.containerElement.querySelector<HTMLInputElement>('#Checkbox_All')!.checked
        if((val == 'All')) {
            this.baseStrs.forEach((value: [boolean, string[]], key: string) => {
                this.baseStrs.set(key, [allBP,  value[1]]);
                this.nestedBaseStrs.set(key, [allBP,  this.nestedBaseStrs.get(key)![1]]);
                (<HTMLInputElement>document.getElementById(`Checkbox_${key}`))!.checked = allBP
                if(allBP) {
                    this.displayBaseStrs += value[1].join('');
                    this.displayNestedBaseStrs += this.nestedBaseStrs.get(key)![1].join('');
                }
            });
        } else {
            if(this.baseStrs.get(val)![0]) {
                this.baseStrs.set(val, [false,  this.baseStrs.get(val)![1]]);
                this.nestedBaseStrs.set(val, [false,  this.nestedBaseStrs.get(val)![1]]);
            } else {
                this.baseStrs.set(val, [true,  this.baseStrs.get(val)![1]]);
                this.nestedBaseStrs.set(val, [true,  this.nestedBaseStrs.get(val)![1]]);
            }
            this.baseStrs.forEach((value: [boolean, string[]], key: string) => {
                if(value[0]) {
                    this.displayBaseStrs += value[1].join('');
                    this.displayNestedBaseStrs += this.nestedBaseStrs.get(key)![1].join('')
                }
            });
        }
        this.pathOrNucleotide();
    }

    private createBPDropdown() {
        if(this.baseStrs.size > 0) {
            let optionList = '<label for = "Checkbox_All"><input type="checkbox" id="Checkbox_All" />All</label>';
            this.baseStrs.forEach((value: [boolean, string[]], key: string) => {
                if(key == 'cWW') {
                    optionList = `${optionList}<label for = "Checkbox_${key}"><input type="checkbox" id="Checkbox_${key}" checked = true/>${key}</label>`;
                } else {
                    optionList = `${optionList}<label for = "Checkbox_${key}"><input type="checkbox" id="Checkbox_${key}"/>${key}</label>`;
                }
            });
            const selectBoxEle = document.getElementById('checkboxes');
            selectBoxEle!.innerHTML = optionList;
            document.getElementById(`Checkbox_All`)?.addEventListener("change", this.changeBP.bind(this, "All"));
            this.baseStrs.forEach((value: [boolean, string[]], key: string) => {
                document.getElementById(`Checkbox_${key}`)?.addEventListener("change", this.changeBP.bind(this, key));
            });
        } 
    }

    private createModeDropdown() {
        let optionList = `<option value="0">Nucleotides</option><option value="1">Path</option></option>`;
        const selectBoxEle = this.containerElement.querySelector<HTMLElement>('.menuSelectbox');
        selectBoxEle!.innerHTML = optionList;
        selectBoxEle!.addEventListener("change", this.pathOrNucleotide.bind(this));
        const nestedBP = this.containerElement.querySelector<HTMLElement>('#nestedBP');
        nestedBP!.addEventListener("change", this.pathOrNucleotide.bind(this));
    }

    private calculateFontSize(apiData: ApiData) {
        let xVals: number[] = [];
        let yVals: number[] = [];
        let dist: number[] = [];
        const lastPathIndex = apiData.svg_paths.length - 1;
        apiData.svg_paths.forEach((pathStr: string, recordIndex: number) => {
            if(recordIndex === 0 || recordIndex === lastPathIndex) return;
            let pathStrParsed:string[] = pathStr.split('M').join(',').split(',')
            xVals[recordIndex] = (Number(pathStrParsed[1])+Number(pathStrParsed[3]))/2
            yVals[recordIndex] = (Number(pathStrParsed[2])+Number(pathStrParsed[4]))/2
            if(recordIndex > 1) {
                let xDiff = xVals[recordIndex] - xVals[recordIndex - 1]
                let yDiff = yVals[recordIndex] - yVals[recordIndex - 1]
                dist[recordIndex] = Math.pow((Math.pow(yDiff, 2) + Math.pow(xDiff, 2)),0.5)
            }
        });
        var sortedDist: number[] = dist.sort((a,b) => {return a - b;})
        return 0.9*sortedDist[Math.floor(sortedDist.length * 0.05)]
    }
    
    private static linearlyInterpolate(v0 : number, v1 : number, interpolationFactor : number) : number {
        // See https://en.wikipedia.org/wiki/Linear_interpolation
        return (1 - interpolationFactor) * v0 + interpolationFactor * v1;
    }

    private pathOrNucleotide() {
        const selectBoxEle:any = this.containerElement.querySelector<HTMLElement>('.menuSelectbox');
        const selectedValue = parseInt(selectBoxEle.value);
        const nestedBP = this.containerElement.querySelector<HTMLInputElement>('#nestedBP')
        if(nestedBP!.checked) {
            var displayBP = this.displayNestedBaseStrs
        } else {
            var displayBP = this.displayBaseStrs
        }
        if(selectedValue == 0) {
            (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(`rnaTopoSvg_${this.pluginOptions.pdbId}`)[0].innerHTML = this.nucleotideStrs.join('') + displayBP;
        } else if(selectedValue == 1) {
            (<any>document.querySelector(`svg.rnaTopoSvg`))!.getElementsByClassName(`rnaTopoSvg_${this.pluginOptions.pdbId}`)[0].innerHTML = this.pathStrs.join('') + displayBP;
        } 
    }

    private calcBaseStrs(baseStr: any, baseMap: any, font_size: number) {
        let start:number = +baseStr.seq_id1
        let end:number = +baseStr.seq_id2
        if(baseStr && start && end) {
            let type:string = baseStr.bp
            let pathID:string = `rnaviewBP rnaviewBP_${this.pluginOptions.pdbId}_${this.pluginOptions.chainId} ${type}_${start}_${end}`
            let n1: string = baseStr.nt1
            let n2: string = baseStr.nt2
            let x1 = this.locations.get(start)![0] + font_size/2.5
            let x2 = this.locations.get(end)![0] + font_size/2.5
            let y1 = this.locations.get(start)![1] - font_size/2.5
            let y2 = this.locations.get(end)![1] - font_size/2.5
            let distance = Math.pow(Math.pow((x1-x2),2)+ Math.pow((y1-y2),2),0.5)
            let x1_prime = UiTemplateService.linearlyInterpolate(x1, x2, font_size/distance)
            let y1_prime = UiTemplateService.linearlyInterpolate(y1, y2, font_size/distance)
            let x2_prime = UiTemplateService.linearlyInterpolate(x1, x2, 1-font_size/distance)
            let y2_prime = UiTemplateService.linearlyInterpolate(y1, y2, 1-font_size/distance)
            let stroke = "#ccc"
            if (type.charAt(0) == 't') {
                var fill = "none"
            } else {
                var fill = "#ccc"
            }
            let xm = (x1_prime + x2_prime)/2
            let ym = (y1_prime + y2_prime)/2
            let distance2 = distance - 2 * font_size
            let height = font_size/1.5
            const defaultAction = `<path class="${pathID}" onmouseover="UiActionsService.showTooltip(evt, '${type} Base Pair ${n1}${start} - ${n2}${end}', '${pathID}', '${stroke}', '${fill}');" onmouseout="UiActionsService.hideTooltip('${pathID}');"`
            if(x1 - x2 != 0) {
                var phi = 90 + Math.atan2((y1 - y2),(x1-x2)) * 180/Math.PI
            } else {
                var phi = 0
            }
            if(type == 'cWW'){
                if(n1 == 'G' && n2 == 'U' || n1 == 'U' && n2 == 'G') {
                    baseMap.get(type)![1].push(`<path class="${pathID}" onmouseover="UiActionsService.showTooltip(evt, '${type} Base Pair ${n1}${start} - ${n2}${end}', '${pathID}', '#000', '#000');"
                    onmouseout="UiActionsService.hideTooltip('${pathID}');"
                    d="
                    M ${(x1_prime + x2_prime)/2 - font_size/4}, ${(y1_prime+y2_prime)/2}
                    a ${font_size/4},${font_size/4} 0 1,0 ${font_size/2},0
                    a ${font_size/4},${font_size/4} 0 1,0 ${-1 * font_size/2},0
                    "
                    stroke="#000" stroke-width="${font_size/6} fill="${fill}"
                />`)
                } else{
                baseMap.get(type)![1].push(`<path class="${pathID}" onmouseover="UiActionsService.showTooltip(evt,  '${type} Base Pair ${n1}${start} - ${n2}${end}', '${pathID}', '#000', '#000');" onmouseout="UiActionsService.hideTooltip('${pathID}');" stroke-width="${font_size/6}" data-stroke-color="#000" stroke="#000" d="M${x1_prime} ${y1_prime} ${x2_prime} ${y2_prime}"></path>`)
                } 
            } 
            else if (type == 'tWW') {
                let xm1 = UiTemplateService.linearlyInterpolate(x1_prime, xm, 1-(font_size/3)/(distance/2))
                let ym1 = UiTemplateService.linearlyInterpolate(y1_prime, ym, 1-(font_size/3)/(distance/2))
                let xm2 = UiTemplateService.linearlyInterpolate(xm, x2_prime, (font_size/3)/(distance/2))
                let ym2 = UiTemplateService.linearlyInterpolate(ym, y2_prime, (font_size/3)/(distance/2))
                baseMap.get(type)![1].push(defaultAction + 
                    `d="
                    M ${x1_prime} ${y1_prime} ${xm1} ${ym1}
                    M ${xm - font_size/3} ${ym}
                    a ${font_size/3},${font_size/3} 0 1,0 ${font_size/1.5},0
                    a ${font_size/3},${font_size/3} 0 1,0 ${-1 * font_size/1.5},0
                    M ${xm2} ${ym2} ${x2_prime} ${y2_prime}"
                    stroke="${stroke}" stroke-width="${font_size/6}" fill = "${fill}"/>`
                )
            } else if (type == 'cSS'||type == 'tSS') {
                baseMap.get(type)![1].push(defaultAction + `
                d="
                M ${xm} ${ym+distance2/2} ${xm} ${ym+height/2} 
                l ${height/2} 0
                l -${height/2} -${height} 
                l -${height/2} ${height}
                l ${height/2} 0
                M ${xm} ${ym - height/2} ${xm} ${ym - distance2/2}
                "stroke="${stroke}" stroke-width="${font_size/6}" fill = "${fill}" transform = "rotate(${phi} ${xm} ${ym})"/>`)
            } else if (type == 'tHS'|| type == 'cHS') {
                baseMap.get(type)![1].push(defaultAction + `
                d="
                M ${xm} ${ym+distance2/2} ${xm} ${ym + height + height/4} 
                h -${height/2}
                v -${height}
                h ${height}
                v ${height}
                h -${height/2}
                M ${xm} ${ym + height/4} ${xm} ${ym - height/4}
                l ${height/2} 0
                l -${height/2} -${height} 
                l -${height/2} ${height}
                l ${height/2} 0
                M ${xm} ${ym - height - height/4} ${xm} ${ym - distance2/2}
                "stroke="${stroke}" stroke-width="${font_size/6}" fill = "${fill}" transform = "rotate(${phi} ${xm} ${ym})"/>`)
            } else if (type == 'tWS' || type == 'cWS') {
                baseMap.get(type)![1].push(defaultAction + `
                d="
                M ${xm} ${ym+distance2/2} ${xm} ${ym + height + height/4} 
                M ${xm - height/2} ${ym + 3*height/4} 
                a ${height/2},${height/2} 0 1,0 ${height},0
                a ${height/2},${height/2} 0 1,0 ${-1 * height},0
                M ${xm} ${ym + height/4} ${xm} ${ym - height/4}
                l ${height/2} 0
                l -${height/2} -${height} 
                l -${height/2} ${height}
                l ${height/2} 0
                M ${xm} ${ym - height - height/4} ${xm} ${ym - distance2/2}
                "stroke="${stroke}" stroke-width="${font_size/6}" fill = "${fill}" transform = "rotate(${phi} ${xm} ${ym})"/>`)
            } else if (type == 'tWH' || type == 'cWH') {
                baseMap.get(type)![1].push(defaultAction + `
                d="
                M ${xm} ${ym+distance2/2} ${xm} ${ym + height + height/4} 
                M ${xm - height/2} ${ym + 3*height/4} 
                a ${height/2},${height/2} 0 1,0 ${height},0
                a ${height/2},${height/2} 0 1,0 ${-1 * height},0
                M ${xm} ${ym + height/4} ${xm} ${ym - height/4}
                h -${height/2}
                v -${height}
                h ${height}
                v ${height}
                h -${height/2}
                M ${xm} ${ym - height - height/4} ${xm} ${ym - distance2/2}
                "stroke="${stroke}" stroke-width="${font_size/6}" fill = "${fill}" transform = "rotate(${phi} ${xm} ${ym})"/>`)
            }
            else if (type == 'tHH' || type == 'cHH' ) {
                baseMap.get(type)![1].push(defaultAction + `
                d="
                M ${xm} ${ym+distance2/2} ${xm} ${ym+height/2} 
                h -${height/2}
                v -${height}
                h ${height}
                v ${height}
                h -${height/2}
                M ${xm} ${ym - height/2} ${xm} ${ym - distance2/2}
                "stroke="${stroke}" stroke-width="${font_size/6}" fill = "${fill}" transform = "rotate(${phi} ${xm} ${ym})"/>`)
            }
        }
    }
    private svgTemplate(apiData: ApiData, FR3DData: any, FR3DNestedData: any): string { 
        const font_size:number = this.calculateFontSize(apiData)
        const lastPathIndex = apiData.svg_paths.length - 1;
        apiData.svg_paths.forEach((pathStr: string, recordIndex: number) => {
            if(recordIndex === 0 || recordIndex === 1 || recordIndex === (lastPathIndex + 1)) return;
            const pathEleClass = `rnaviewEle rnaviewEle_${this.pluginOptions.pdbId} rnaview_${this.pluginOptions.pdbId}_${apiData.label_seq_ids[recordIndex - 1]}`;
            let strokeColor = this.pluginOptions.theme?.color || '#323232';
            const strokeWide = this.pluginOptions.theme?.strokeWidth || '2';
            let isUnobserved = false;
            if(apiData.unobserved_label_seq_ids && apiData.unobserved_label_seq_ids.indexOf(apiData.label_seq_ids[recordIndex - 1]) > -1) {
                strokeColor = this.pluginOptions.theme?.unobservedColor || '#ccc';
                isUnobserved = true;
            }
            let pathStrParsed:string[] = pathStr.split('M').join(',').split(',')
            let xVal:number = Number(pathStrParsed[3]) 
            let yVal:number = Number(pathStrParsed[4])
            this.locations.set(apiData.label_seq_ids[recordIndex - 1], [xVal, yVal])
            this.pathStrs.push(
                `<path 
                    class="${pathEleClass}" stroke-width="${strokeWide}" stroke="${strokeColor}" d="${pathStr}" 
                    data-stroke-color="${strokeColor}" 
                    onclick="UiActionsService.selectNucleotide('${this.pluginOptions.pdbId}', '${this.pluginOptions.entityId}', ${apiData.label_seq_ids[recordIndex - 1]}', 'click', ${isUnobserved}, '${apiData.sequence[recordIndex - 2]}, event, ${this.pluginOptions.theme?.highlightColor ? "'"+this.pluginOptions.theme.highlightColor+"'" : undefined})" 
                    onmouseover="UiActionsService.selectNucleotide('${this.pluginOptions.pdbId}', '${this.pluginOptions.entityId}', ${apiData.label_seq_ids[recordIndex - 1]}, 'mouseover', ${isUnobserved}, '${apiData.sequence[recordIndex - 2]}', event, ${this.pluginOptions.theme?.highlightColor ? "'"+this.pluginOptions.theme.highlightColor+"'" : undefined})" 
                    onmouseout="UiActionsService.unSelectNucleotide('${this.pluginOptions.pdbId}', '${this.pluginOptions.entityId}', ${apiData.label_seq_ids[recordIndex - 1]}, ${isUnobserved}, event, '${strokeColor}')">
                </path>`)
            this.nucleotideStrs.push(
                `<text href="#${pathEleClass}" class="${pathEleClass}" x="${xVal}" y="${yVal}" font-size = "${font_size}px" onclick="UiActionsService.selectNucleotide('${this.pluginOptions.pdbId}', '${this.pluginOptions.entityId}', ${apiData.label_seq_ids[recordIndex - 1]}, 'click', ${isUnobserved}, '${apiData.sequence[recordIndex - 2]}',
                event, ${this.pluginOptions.theme?.highlightColor ? "'"+this.pluginOptions.theme.highlightColor+"'" : undefined})" onmouseover="UiActionsService.selectNucleotide('${this.pluginOptions.pdbId}', '${this.pluginOptions.entityId}', ${apiData.label_seq_ids[recordIndex - 1]}, 'mouseover', ${isUnobserved}, '${apiData.sequence[recordIndex - 2]}',
                event, ${this.pluginOptions.theme?.highlightColor ? "'"+this.pluginOptions.theme.highlightColor+"'" : undefined})" onmouseout="UiActionsService.unSelectNucleotide('${this.pluginOptions.pdbId}', '${this.pluginOptions.entityId}', ${apiData.label_seq_ids[recordIndex - 1]}, ${isUnobserved}, event, '${strokeColor}')">${apiData.sequence[recordIndex - 2]}</text>`)
            });
        
        let baseArray = FR3DData.annotations;
        let nestedBaseArray = FR3DNestedData.annotations;
        this.baseStrs.set('cWW', [true, []]);
        this.baseStrs.set('tWW', [false, []]);
        this.baseStrs.set('cWH', [false, []]);
        this.baseStrs.set('tWH', [false, []]);
        this.baseStrs.set('cWS', [false, []]);
        this.baseStrs.set('tWS', [false, []]);
        this.baseStrs.set('cHH', [false, []]);
        this.baseStrs.set('tHH', [false, []]);
        this.baseStrs.set('cHS', [false, []]);
        this.baseStrs.set('tHS', [false, []]);
        this.baseStrs.set('cSS', [false, []]);
        this.baseStrs.set('tSS', [false, []]);

        this.nestedBaseStrs.set('cWW', [true, []]);
        this.nestedBaseStrs.set('tWW', [false, []]);
        this.nestedBaseStrs.set('cWH', [false, []]);
        this.nestedBaseStrs.set('tWH', [false, []]);
        this.nestedBaseStrs.set('cWS', [false, []]);
        this.nestedBaseStrs.set('tWS', [false, []]);
        this.nestedBaseStrs.set('cHH', [false, []]);
        this.nestedBaseStrs.set('tHH', [false, []]);
        this.nestedBaseStrs.set('cHS', [false, []]);
        this.nestedBaseStrs.set('tHS', [false, []]);
        this.nestedBaseStrs.set('cSS', [false, []]);
        this.nestedBaseStrs.set('tSS', [false, []]);

        nestedBaseArray.forEach((baseStr: any) => {
            this.calcBaseStrs(baseStr, this.nestedBaseStrs, font_size)
        })
        baseArray.forEach((baseStr: any) => {
            this.calcBaseStrs(baseStr, this.baseStrs, font_size)
        })
        this.baseStrs.forEach((value: [boolean, string[]], key: string) => {
            if(value[0]) {
                this.displayBaseStrs += value[1].join('');
            }
            if(this.nestedBaseStrs.get(key)![0]) {
                this.displayNestedBaseStrs += this.nestedBaseStrs.get(key)![1].join('');
            }
        });

        return `
        <div style="width:100%;height:100%;z-index:0;position:absolute;">
            <svg preserveAspectRatio="xMidYMid meet" 
            viewBox="0 0 ${apiData.dimensions.width} ${apiData.dimensions.height}" 
            style="width:100%;height:100%;position:relative;">
                <g class="rnaTopoSvgSelection rnaTopoSvgSelection_${this.pluginOptions.pdbId}"></g>
            </svg>
        </div>
        <div style="width:100%;height:100%;z-index:1;position:absolute;">
            <svg preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 ${apiData.dimensions.width} ${apiData.dimensions.height}" 
            style="width:100%;height:100%;position:relative;">
                <g class="rnaTopoSvgHighlight rnaTopoSvgHighlight_${this.pluginOptions.pdbId}"></g>
            </svg>
        </div>
        <div id="tooltip" display="none" style="position:absolute; display: none;"></div> 
            <div style="width:100%;height:100%;z-index:2;position:absolute;">
                <svg class="rnaTopoSvg" preserveAspectRatio="xMidYMid meet" 
                    viewBox="0 0 ${apiData.dimensions.width} ${apiData.dimensions.height}" 
                    style="width:100%;height:100%;">
                        <g class="rnaTopoSvg_${this.pluginOptions.pdbId}">${this.nucleotideStrs.join('')}${this.displayBaseStrs}</g>
                </svg>
            </div>`
            ;
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