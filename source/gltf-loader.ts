// Originally derived from THREE.GLTFLoader
// https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/GLTFLoader.js

import { GlTf } from './gltf';

import { FileLoader } from './fileloader';
import { BINARY_EXTENSION_HEADER_MAGIC, GLTFBinaryExtension } from './glb-decoder';
import { GltfParser } from './gltf-parser';
import { LoaderUtils } from './loaderutils';
import { LoadingManager } from './loadingmanager';

export class GltfLoader {
    manager: LoadingManager;
    path: string;
    crossOrigin: boolean;
    constructor(manager?: LoadingManager) {
        this.manager = manager || new LoadingManager();
    }

    async load(url: string, onProgress?: (xhr: XMLHttpRequest) => void): Promise<GlTf> {
        const path = this.path !== undefined ? this.path : LoaderUtils.extractUrlBase(url);
        const loader = new FileLoader(this.manager);
        loader.setResponseType('arraybuffer');
        const data = await loader.load(url, onProgress);
        return await this.parse(data, path);
    }

    setCrossOrigin(value: boolean) {
        this.crossOrigin = value;
        return this;
    }

    setPath(value: string) {
        this.path = value;
        return this;
    }

    async parse(data: any, path: any): Promise<GlTf> {
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

        // TODO!: extensions (lights, specular glossiness)
        // if ( json.extensionsUsed ) {
        //     if ( json.extensionsUsed.indexOf( EXTENSIONS.KHR_LIGHTS ) >= 0 ) {
        //         extensions[ EXTENSIONS.KHR_LIGHTS ] = new GLTFLightsExtension( json );
        //     }

        //     if ( json.extensionsUsed.indexOf( EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ) >= 0 ) {
        //         extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ] =
        //             new GLTFMaterialsPbrSpecularGlossinessExtension();
        //     }
        // }

        // tslint:disable:no-console
        console.time('GLTFLoader');

        const parser = new GltfParser(json, extensions, {
            path: path || this.path || '',
            crossOrigin: this.crossOrigin,
            manager: this.manager,
        });

        const gltf = await parser.parse();
        console.timeEnd('GLTFLoader');
        return gltf;
    }
}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

export const EXTENSIONS = {
    KHR_BINARY_GLTF: 'KHR_binary_glTF',
    KHR_LIGHTS: 'KHR_lights',
    KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
};
