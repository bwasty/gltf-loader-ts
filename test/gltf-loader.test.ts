import * as chai from 'chai';
const expect = chai.expect;
import * as sinon from 'sinon';

import { GltfLoader } from '../source/gltf-loader';

import * as XMLHttpRequest from 'xhr2';
(global as any).XMLHttpRequest = XMLHttpRequest;

const SAMPLE_MODELS_BASE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';

// arrow functions are discouraged for mocha
// -> https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions

describe('gltf-operate', function() {
    it('should load normal gltf files', function(done) {
        const loader = new GltfLoader();
        loader.load(
            SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf',
            // onLoad
            (gltf) => {
                expect(gltf.asset.version).to.equal('2.0');
                expect(gltf.buffers[0].uri).to.equal('Box0.bin');
                expect(gltf.materials[0].name).to.equal('Red');
                done();
            },
            undefined, // onProgress,
            done, // onError
        );
    });

    it('should load GLB files', function(done) {
        const loader = new GltfLoader();
        loader.load(
            SAMPLE_MODELS_BASE + 'Box/glTF-Binary/Box.glb',
            // onLoad
            (gltf) => {
                expect(gltf.asset.version).to.equal('2.0');
                expect(gltf.buffers[0].byteLength).to.equal(648);
                expect(gltf.materials[0].name).to.equal('Red');
                done();
            },
            undefined, // onProgress
            done, // onError
        );
    });

    it('should load files with embedded data', function(done) {
        const loader = new GltfLoader();
        loader.load(
            SAMPLE_MODELS_BASE + 'Box/glTF-Embedded/Box.gltf',
            // onLoad
            (gltf) => {
                expect(gltf.buffers[0].uri).to.match(/^data:application\/octet-stream;base64,AAA/);
                done();
            },
            undefined, // onProgress
            done, // onError
        );
    });

    ///
    it('should report progress via onProgress', () => {
        // TODO!!
    });

    it('should report errors via the onError callback', () => {
        // TODO!!
    });
});

