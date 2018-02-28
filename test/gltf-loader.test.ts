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

describe('gltf-loader', function() {
    it('should load normal gltf files', async function() {
        const loader = new GltfLoader();
        const gltf = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf');
        expect(gltf.asset.version).to.equal('2.0');
        expect(gltf.buffers[0].uri).to.equal('Box0.bin');
        // TODO!!: test bin loading + accessor...
        expect(gltf.materials[0].name).to.equal('Red');
    });

    it('should load GLB files', async function() {
        const loader = new GltfLoader();
        const gltf = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF-Binary/Box.glb');
        expect(gltf.asset.version).to.equal('2.0');
        expect(gltf.buffers[0].byteLength).to.equal(648);
        // TODO!!: test accessor...
        expect(gltf.materials[0].name).to.equal('Red');
    });

    it('should load files with embedded data', async function() {
        const loader = new GltfLoader();
        const gltf = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF-Embedded/Box.gltf');
        expect(gltf.buffers[0].uri).to.match(/^data:application\/octet-stream;base64,AAA/);
        // TODO!!: test accessor...
    });

    it('should report progress via onProgress', async function() {
        let onProgressCalled = false;
        const loader = new GltfLoader();
        const promise = loader.load(
            SAMPLE_MODELS_BASE + '2CylinderEngine/glTF-Binary/2CylinderEngine.glb',
            (xhr: any) => { // onProgress
                expect(xhr.loaded / xhr.total).to.be.within(0, 1);
                onProgressCalled = true;
            },
        );
        const gltf = await promise;
        if (!onProgressCalled) {
            throw new Error('onProgress not called');
        }
    });

    it('should report errors via the onError callback', async function() {
        const loader = new GltfLoader();
        try {
            const gltf = await loader.load(SAMPLE_MODELS_BASE + 'this/should/404');
            throw new Error('this should have failed.');
        } catch (error) {
            expect(error).to.eql({ status: 404, statusText: 'Not Found' });
        }
    });
});

