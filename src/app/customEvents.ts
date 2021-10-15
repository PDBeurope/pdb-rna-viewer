export namespace CustomEvents {

    export function create(eventTypeArr: string[]){
        let eventObj = {} as any;
        for(let ei = 0, el = eventTypeArr.length; ei < el; ei++){
            let eventType = eventTypeArr[ei];
            let event;
            if (typeof MouseEvent == 'function') {
                // current standard
                event = new MouseEvent(eventType, { 'view': window, 'bubbles': true, 'cancelable': true });
            } else if (typeof document.createEvent == 'function') {
                // older standard
                event = document.createEvent('MouseEvents');
                event.initEvent(eventType, true /* bubbles */, true /* cancelable */);

            }
            eventObj[eventType] = event;
        };
        return eventObj;
    }

    export function dispatchCustomEvent(event: any, eventData: any, targetElement: HTMLElement) {
        event['eventData'] = eventData;
        targetElement.dispatchEvent(event);
    }

    export function subscribeToComponentEvents(pluginCtx: any) {

        document.addEventListener('protvista-click', function(e: any){
            if(typeof e.detail !== 'undefined'){
                const startResidue = parseInt(e.detail.start);
                const endResidue = parseInt(e.detail.end);
                pluginCtx.clearSelection();
                for(let i = startResidue; i <= endResidue; i++) {
                    pluginCtx.selectResidue(i, e.detail.color);
                }
            }           
        });

        document.addEventListener('protvista-mouseover', function(e: any){
            if(typeof e.detail !== 'undefined'){
                const startResidue = parseInt(e.detail.start);
                const endResidue = parseInt(e.detail.end);
                pluginCtx.clearHighlight();
                for(let i = startResidue; i <= endResidue; i++) {
                    pluginCtx.highlightResidue(i, e.detail.color);
                }
            }           
        });
    
        document.addEventListener('protvista-mouseout', function(e: any){
            pluginCtx.clearHighlight();
        });

        document.addEventListener("PDB.molstar.click", (e: any) => {
            if(typeof e.eventData !== 'undefined' && typeof e.eventData.residueNumber !== 'undefined' && e.eventData.auth_asym_id === pluginCtx.options.chainId){
                pluginCtx.clearSelection();
                pluginCtx.selectResidue(e.eventData.residueNumber);
            }
        });

        document.addEventListener("PDB.molstar.mouseover", (e: any) => {
            if(typeof e.eventData !== 'undefined' && typeof e.eventData.residueNumber !== 'undefined' && e.eventData.auth_asym_id === pluginCtx.options.chainId){
                pluginCtx.clearHighlight();
                pluginCtx.highlightResidue(e.eventData.residueNumber);
            }
        });

        document.addEventListener("PDB.molstar.mouseout", () => {
            pluginCtx.clearHighlight();
        });
    }

}