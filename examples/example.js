(async function() { // wrap in async function to use await
    let sample_models_base = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/'
    let model_url = sample_models_base + 'BoxTextured/glTF/BoxTextured.gltf';
    // model_url = sample_models_base + 'BoxTextured/glTF-Embedded/BoxTextured.gltf';
    // model_url = sample_models_base + 'BoxTextured/glTF-Binary/BoxTextured.glb';

    //
    // Load asset
    //
    let loader = new GltfLoader.GltfLoader();
    loader.enableValidation();
    try {
        let asset = await loader.load(
            model_url,
            (xhr) => { // optional onProgress callback
                if (xhr.total)
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                else
                    console.log("Finished loading")
            },
        )

        //
        // Parse asset
        //
        const gltf = asset.gltf; // See https://bwasty.github.io/gltf-loader-ts/interfaces/gltf.html
        let sceneIndex = gltf.scene | 0;
        let scene = gltf.scenes[sceneIndex];
        let rootNodes = scene.nodes;
        for (let nodeIndex of rootNodes) {
            // get to the first primitive
            let node = gltf.nodes[nodeIndex];
            let child = gltf.nodes[node.children[0]];
            let mesh = gltf.meshes[child.mesh];
            let primitive = mesh.primitives[0];

            // get the vertex data for the primitive
            let positionAccessorIndex = primitive.attributes.POSITION;

            //
            // Get the binary data, which might be in a .bin file that still has to be loaded,
            // in another part of the source GLB file, or embedded as a data URI.
            //
            let data = await asset.accessorData(positionAccessorIndex);
            console.log("Accessor containing positions: ", data);
            // For rendering, `data` can be bound via `gl.BindBuffer`,
            // and the accessor properties can be used with `gl.VertexAttribPointer`

            // parse the material to get to the first texture
            let material = gltf.materials[primitive.material];
            let baseColorTexture = gltf.textures[material.pbrMetallicRoughness.baseColorTexture.index];
            let imageIndex = baseColorTexture.source;

            //
            // Get image data which might also be in a separate file, in a GLB file,
            // or embedded as a data URI.
            //
            let image = await asset.imageData.get(imageIndex);
            document.body.appendChild(image);
            // For rendering, use `gl.texImage2D` with the image
        }
    } catch (e) {
        console.error(e);
    }

})();
