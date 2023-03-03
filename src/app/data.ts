export type ThemeParam = {
    color?: string,
    highlightColor?: string,
    unobservedColor?: string,
    strokeWidth?: number
}

export type PluginOptions = {
    pdbId: string,
    chainId: string,
    entityId: string,
    theme?: ThemeParam,
    subscribeEvents?: boolean
}

export type ApiData = {
    svg_paths: string[],
    dimensions: {
        width: number,
        height: number
    },
    sequence: string,
    unobserved_label_seq_ids: number[],
    auth_seq_ids: number[],
    label_seq_ids: number[],
    pdb_ins_codes: string[]
}

export class DataService {
    async getApiData(entityId: string, chainId: string, pdbId: string): Promise<ApiData | undefined> {
        try {
            const apiUrl = `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId.toLowerCase()}_${entityId}_${chainId.toUpperCase()}.json`;
            return await (await fetch(apiUrl)).json() as ApiData;
        } catch (e) { 
            this.handleError(e)
            return void 0;
        };
    }
    async getFR3DData(pdbId: string, chainId: string): Promise<JSON | undefined> {
        try {
            const csvUrl = `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId.toLowerCase()}_${chainId.toUpperCase()}_basepair.json`;
            return await (await fetch(csvUrl)).json() as JSON;
        } catch (e) { 
            this.handleFR3DError(e)
            return void 0;
        };
    }
    private handleError(e: any): void {
        console.log(`RNA topology data not available!`, e);
    }
    private handleFR3DError(e: any): void {
        console.log(`FR3D mapping data not available!`, e);
    }
}

