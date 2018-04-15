// Originally derived from THREE.GLTFLoader
// https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/GLTFLoader.js


import { FileLoader } from './fileloader';
import { BINARY_EXTENSION_HEADER_MAGIC, GLTFBinaryExtension } from './glb-decoder';
import { GltfAsset } from './gltf-asset';
import { LoaderUtils } from './loaderutils';
import { LoadingManager } from './loadingmanager';

export class GltfLoader {
    private manager: LoadingManager;
    // private crossOrigin: boolean; // TODO!: use/remove

    constructor(manager?: LoadingManager) {
        this.manager = manager || new LoadingManager();
    }

    async load(url: string, onProgress?: (xhr: XMLHttpRequest) => void): Promise<GltfAsset> {
        const path = LoaderUtils.extractUrlBase(url);
        // TODO!: allow changing loader options(headers etc.)?
        const loader = new FileLoader(this.manager);
        loader.responseType = 'arraybuffer';
        const data = await loader.load(url, onProgress);
        return await this.parse(data, path);
    }

    private async parse(data: any, path: any): Promise<GltfAsset> {
        let content: any;
        const extensions: {[k: string]: any} = {};

        if (typeof data === 'string') {
            content = data;
        } else {
            const magic = LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
            if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
                extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(data);
                content = extensions[EXTENSIONS.KHR_BINARY_GLTF].content;
            } else {
                content = LoaderUtils.decodeText(new Uint8Array(data));
            }
        }

        const json = JSON.parse(content);

        if (json.asset === undefined || json.asset.version[ 0 ] < 2) {
            throw new Error('Unsupported asset. glTF versions >=2.0 are supported.');
        }

        return new GltfAsset(
            json,
            path || '',
            extensions,
            this.manager,
        );
    }
}

export const EXTENSIONS = {
    KHR_BINARY_GLTF: 'KHR_binary_glTF',
};
