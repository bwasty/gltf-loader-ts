import * as chai from 'chai';
import * as spies from 'chai-spies';

const expect = chai.expect;
chai.use(spies);
const spy = chai.spy;

import { GltfLoader } from '../source/gltf-loader';

import * as XMLHttpRequest from 'xhr2';
import { LoadingManager } from '../source/loadingmanager';
(global as any).XMLHttpRequest = XMLHttpRequest;

const SAMPLE_MODELS_BASE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';
// const SAMPLE_MODELS_BASE = 'https://localhost:8081';


// arrow functions are discouraged for mocha
// -> https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions

describe('gltf-loader', function() {
    it('should load normal gltf files', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf');
        expect(asset.gltf.asset.version).to.equal('2.0');
        expect(asset.gltf.materials[0].name).to.equal('Red');
        expect(asset.gltf.buffers[0].uri).to.equal('Box0.bin');
        const buffer = await asset.bufferData.get(0);
        expect(buffer.byteLength).to.equal(asset.gltf.buffers[0].byteLength);
        // TODO!!!: test bufferView...
    });

    it('should load GLB files', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF-Binary/Box.glb');
        expect(asset.gltf.asset.version).to.equal('2.0');
        expect(asset.gltf.buffers[0].byteLength).to.equal(648);
        expect(asset.gltf.materials[0].name).to.equal('Red');
        const buffer = await asset.bufferData.get(0);
        expect(buffer.byteLength).to.equal(asset.gltf.buffers[0].byteLength);
        // TODO!!!: test bufferView...
    });

    it('should load files with embedded data', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF-Embedded/Box.gltf');
        expect(asset.gltf.buffers[0].uri).to.match(/^data:application\/octet-stream;base64,AAA/);
        // TODO!!: test buffer, bufferView...
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

    it('should handle an external loadingManager correctly', async function() {
        const URL = SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf';
        let manager = new LoadingManager();
        manager.onStart = spy((url, itemsLoaded, itemsTotal) => {
            expect(url).to.equal(URL);
            expect(itemsLoaded).to.equal(0);
            expect(itemsTotal).to.equal(1);
        });
        manager.onProgress = spy((url, itemsLoaded, itemsTotal) => {
            expect(url).to.equal(URL);
            expect(itemsLoaded).to.equal(1);
            expect(itemsTotal).to.equal(1);
        });
        manager.onLoad = spy(() => {});
        manager.onError = spy((url) => {});

        let loader = new GltfLoader(manager);
        const promise = loader.load(URL);
        expect(manager.onStart).to.have.been.called();
        const gltf = await promise;
        expect(manager.onProgress).to.have.been.called();
        expect(manager.onLoad).to.have.been.called();
        expect(manager.onError).to.have.not.been.called();

        // test onError
        manager = new LoadingManager();
        manager.onError = spy((url) => {
            expect(url).to.equal(SAMPLE_MODELS_BASE + 'this/should/404');
        });
        loader = new GltfLoader(manager);
        try {
            await loader.load(SAMPLE_MODELS_BASE + 'this/should/404');
        } catch { }
        expect(manager.onError).to.have.been.called();
    });

    // TODO!!!: test bufferViewData / buffer caching / fetchAll...

    // TODO!!: test images

    // TODO!!: test loading from FileList (drag and drop)
});

