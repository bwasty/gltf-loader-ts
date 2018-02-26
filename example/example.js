let loader = new GltfLoader.GltfLoader()
loader.load(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
    // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
    // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb',
    // onLoad
    (gltf) => {
        console.log(gltf)
    },
    // onProgress
    (xhr) => {
        if (xhr.total)
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        else
            console.log("Finished loading")
    },
    // onError
    (error) => {
        console.error(error)
    }
)
