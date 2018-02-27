import { Asset } from './asset';

// TODO!!!: obsolete?
export class GltfParser {
    json: any;
    extensions: any;
    options: any; // TODO!!!: type the options...
    constructor(json: string, extensions: any, options: any) {
        this.json = json || {};
        this.extensions = extensions || {};
        this.options = options || {};
    }

    async parse(): Promise<Asset> {
        return new Asset(this.json, this.options.path, this.extensions, this.options.manager);
    }
}
