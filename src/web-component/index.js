import { LitElement } from "lit-element";

class PdbRnaViewer extends LitElement {

  static get properties() {
    return {
      pdbId: { type: String, attribute: 'pdb-id' },
      entityId: { type: String, attribute: 'entity-id' },
      chainId: { type: String, attribute: 'chain-id' },
      subscribeEvents: { type: Boolean, attribute: 'subscribe-events' },
    };
  }

  validateParams() {
    if(typeof this.pdbId == 'undefined' || typeof this.entityId == 'undefined' || typeof this.chainId == 'undefined') return false;
    return true
  }

  connectedCallback() {
    super.connectedCallback();

    let paramValidatity = this.validateParams();
    if(!paramValidatity) return

    // create an instance of the plugin
    this.viewInstance = new PdbRnaViewerPlugin();    
    const options = {
      pdbId: this.pdbId,
      entityId: this.entityId,
      chainId: this.chainId
    }
    if(this.subscribeEvents) options.subscribeEvents = true;
    this.viewInstance.render(this, options);
  }

  createRenderRoot() {
    return this;
  }

}

export default PdbRnaViewer;

customElements.define('pdb-rna-viewer', PdbRnaViewer);