import * as chai from 'chai';
const expect = chai.expect;
import * as sinon from 'sinon';

import { GltfLoader } from '../source/gltf-loader';

import * as XMLHttpRequest from 'xhr2';
(global as any).XMLHttpRequest = XMLHttpRequest;

describe('gltf-operate', () => {
    it('should load normal gltf files', () => {
        const loader = new GltfLoader();
        loader.load(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
            // onLoad
            (gltf) => {
                // console.log(gltf)
            },
            // onProgress
            (xhr: any) => {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // onError
            (error) => {
                // console.error(error)
            },
        );
    });

    it('should load GLB files', () => {
        // TODO!!
    });

    it('should load files with embedded data', () => {
        // TODO!!
    });

    ///
    it('should report progress via onProgress', () => {
        // TODO!!
    });

    it('should report errors via the onError callback', () => {
        // TODO!!
    });
});

