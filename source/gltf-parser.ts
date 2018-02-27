import { Asset } from './asset';
import { FileLoader } from './fileloader';

export class GltfParser {
    json: any;
    extensions: any;
    options: any; // TODO!!!: type the options...
    cache: GLTFRegistry;
    fileLoader: FileLoader;
    textureLoader: any;
    constructor(json: string, extensions: any, options: any) {
        this.json = json || {};
        this.extensions = extensions || {};
        this.options = options || {};

        this.cache = new GLTFRegistry();

        // TODO!!: image loading...
        // this.textureLoader = new THREE.TextureLoader( this.options.manager);
        // this.textureLoader.setCrossOrigin( this.options.crossOrigin );

        // TODO!: allow changing loader options(headers etc.)?
        this.fileLoader = new FileLoader(this.options.manager);
        this.fileLoader.responseType = 'arraybuffer';
    }

    async parse(): Promise<Asset> {
        return new Asset(this.json, this.options.path, this.extensions, this.options.manager);
    }

    /**
     * Requests the specified dependency asynchronously, with caching.
     */
    getDependency(type: string, index: number): Promise<object> {
        const cacheKey = type + ':' + index;
        let dependency = this.cache.get(cacheKey);
        if (!dependency) {
            const fnName = 'load' + type.charAt(0).toUpperCase() + type.slice(1);
            dependency = (this as any)[fnName](index);
            this.cache.add(cacheKey, dependency);
        }
        return dependency;
    }

    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
     */
    loadTexture(textureIndex: number) { // TODO!!: return? was Promise<THREE.Texture>
        const parser = this;
        const json = this.json;
        const options = this.options;
        const textureLoader = this.textureLoader;

        const URL = window.URL || (window as any).webkitURL;

        const textureDef = json.textures[textureIndex ];
        const source = json.images[textureDef.source ];
        let sourceURI = source.uri;
        let isObjectURL = false;

        if (source.bufferView !== undefined) {
            // Load binary image data from bufferView, if provided.
            sourceURI = parser.getDependency('bufferView', source.bufferView).then((bufferView) => {
                isObjectURL = true;
                const blob = new Blob([bufferView ], { type: source.mimeType });
                sourceURI = URL.createObjectURL(blob);
                return sourceURI;
            });
        }

        return Promise.resolve(sourceURI).then((sourceURI) => {
            // Load Texture resource.
            const loader = textureLoader;

            return new Promise((resolve, reject) => {
                loader.load(resolveURL(sourceURI, options.path), resolve, undefined, reject);
            });

        }).then((texture) => {
            // Clean up resources and configure Texture.
            if (isObjectURL === true) {
                URL.revokeObjectURL(sourceURI);
            }

            // TODO!!: return `Image`?
            return texture;
        });
    }
}

// tslint:disable-next-line:max-classes-per-file
export class GLTFRegistry {
    objects: { [k: string]: any } = {};
    get(key: any) {
        return this.objects[key];
    }
    add(key: any, object: any) {
        this.objects[key] = object;
    }
    remove(key: any) {
        delete this.objects[key];
    }
    removeAll() {
        this.objects = {};
    }
}

/* CONSTANTS */

/* UTILITY FUNCTIONS */

export function resolveURL(url: string, path: string) {
    // Invalid URL
    if (typeof url !== 'string' || url === '') { return ''; }
    // Absolute URL http://,https://,//
    if (/^(https?:)?\/\//i.test(url)) { return url; }
    // Data URI
    if (/^data:.*,.*$/i.test(url)) { return url; }
    // Blob URL
    if (/^blob:.*$/i.test(url)) { return url; }
    // Relative URL
    return path + url;
}
