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
            const apiUrl = `https://wwwdev.ebi.ac.uk/pdbe/static/rfam_images/${pdbId.toLowerCase()}_${entityId}_${chainId.toUpperCase()}.json`;
            return await (await fetch(apiUrl)).json() as ApiData;
        } catch (e) { 
            this.handleError(e)
            return void 0;
        };
    }

    private handleError(e: any): void {
        console.log(`RNA topology data not unavailable!`, e);
    }
}