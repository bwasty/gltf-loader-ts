let loader = new GltfLoader.GltfLoader()
loader.load(
    // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
    // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
    // onLoad
    (gltf) => {
        console.log(gltf)
    },
    // onProgress
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // onError
    (error) => {
        console.error(error)
    }
)
