import { GlTf, GlTfId } from './gltf';
import { LoadingManager } from './loadingmanager';

export class Asset {
    /** The JSON part of the asset */
    gltf: GlTf;
    bufferData: BufferData;
    imageData: ImageData;

    constructor(gltf: GlTf, bufferData: any, imageData: any) {
        this.gltf = gltf;
        this.bufferData = bufferData;
        this.imageData = imageData;
    }
}

// tslint:disable:max-classes-per-file
class BufferData {
    baseUri: string;
    manager: LoadingManager;
    constructor(baseUri: string, manager: LoadingManager) {
        this.baseUri = baseUri;
        this.manager = manager;
    }

    /**
     * Get the buffer data. Might trigger a network request if theres is an external .bin file
     * when it's accessed for the first time and `fetchAll` has not been used.
     */
    async get(index: GlTfId): Promise<ArrayBuffer> {
        // TODO!!!: implement
        return new ArrayBuffer(0);
    }

    /** Pre-fetches all buffer data */
    fetchAll() {
        // TODO!!
    }
}

class ImageData {
    baseUri: string;
    manager: LoadingManager;
    constructor(baseUri: string, manager: LoadingManager) {
        this.baseUri = baseUri;
        this.manager = manager;
    }

    /**
     * Get the buffer data. Might trigger a network request if data is in an extermal image
     * file when it's accessed for the first time and `fetchAll` has not been used.
     */
    async get(index: GlTfId): Promise<HTMLImageElement> {
        // TODO!!!: implement
        return new Image();
    }

    /** Pre-fetches all buffer data */
    fetchAll() {
        // TODO!!
    }
}
