  
/*This is just a portion of my code, to be updated*/ 

/*3D model credits:
3D MODELS USED: 
N.D. Mixamo.com. Xbot. Character model with idle, run, walk, dance, animations. Retrieved by: https://www.mixamo.com/
N.D. blue man group. (2020, N.D, N.D). Future Bench [3D Model]. Sketchfab.com. Retrieved by:https://sketchfab.com/3d-models/future-bench-03e79f17bcd742e0927171d1c71fba20 
Carbajal, Michael. (2010, August 03). Advanced Crew Escape Suit. NASA Headquarters [3D model]. Retrieved by:  https://nasa3d.arc.nasa.gov/detail/aces
Carbajal, Michael. (2010, August 3). Extravehicular Mobility Unit. NASA Headquarters [3D model]. Retrieved by: https://nasa3d.arc.nasa.gov/detail/emu  
N.D. (2015, July 14). Z2 Spacesuit. [3D Model] NASA LaRC Advanced Concepts Lab, AMA Studios. Retrieved by: https://nasa3d.arc.nasa.gov/detail/nmss-z2 
NASA/JPL-Caltech. (2020, June 10). Mars Perseverance Rover, 3D Model. 3D Model retrieved by:  https://mars.nasa.gov/resources/25042/mars-perseverance-rover-3d-model/ 
Solar System Model by: Solar System Model (Orrery) by Smoggybeard is licensed under Creative Commons Attribution, https://sketchfab.com/3d-models/solar-system-model-orrery-ca0a6f6971a94fcc8d47421342dc6f40#download 
curiousity rover, published by Nasa: https://nasa3d.arc.nasa.gov/detail/curiosity-clean
*/

  import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
  import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
  import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
  import { OBJLoader } from 'https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/jsm/loaders/OBJLoader.js';
  import { MTLLoader } from 'https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/jsm/loaders/MTLLoader.js';

  let camera; 

  //This is mainly where my code begins, most of this is loading in models, looping through animations, adding textures, and more Three.js shenanigans. 
  class SpaceLearningGame {
    constructor() {
    this.initialize();
  }

  initialize() {
    //some setup
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.html_Encoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    //this adds the Three.js code to the DOM
    document.body.appendChild(this._threejs.domElement);

    //this just resize the widow
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    //this is bog standard three.js, mostly just setting up the field of vision, aspect ratin, how near and far the camera is, where it's positioned. 
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far); 
    camera.position.set(25, 10, 25);

   //creating a new scene
    this._scene = new THREE.Scene();

   
    //setting up the directinal light, this does not play well with the ambient light and casts a weird shadow, but I had no time to fix it. 
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this._scene.add(light);

    //this is the offending ambient light
    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this._scene.add(light);

    //this a loader to bring in my cubes.
    const loader = new THREE.CubeTextureLoader();

    //this is where my skybox is being created, I used the starry night image, credited above. 
    const texture = loader.load([
    'galaxy_skybox/nightsky_small.jpg',
    'galaxy_skybox/nightsky_small.jpg',
    'galaxy_skybox/nightsky_small.jpg',
    'galaxy_skybox/nightsky_small.jpg',
    'galaxy_skybox/nightsky_small.jpg',
    'galaxy_skybox/nightsky_small.jpg',
    ]);

    //encodes the texture. Three.js standard protocol. 
    texture.encoding = THREE.sRGBEncoding;

    //this jsut adds the background. 
    this._scene.background = texture;

    //This is bringing in the floor. 
    let texture_plane = THREE.ImageUtils.loadTexture( "../images/floor_texture_2.jpg" );
    let material_plane = new THREE.MeshLambertMaterial({ map : texture_plane });
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300, 10, 10),
        material_plane);
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    //this is where my animations will be stored, in an array
    this.mixs = [];

    //this checks to see if we are in the previous frame
    this.prevRF = null;
  
    //this is where I add the Apollo11 audio, from the NASA website
    const listener = new THREE.AudioListener();
    camera.add( listener );

    const sound = new THREE.PositionalAudio( listener );


    //credit given above, Nasa archives
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'audio/nasa_sound_mixdown.ogg', function( buffer ) {
      sound.setBuffer( buffer );
      sound.setRefDistance( 20 );
      sound.play();
    });


    //this basically creates a round sphere where the sound will come from, so it sounds closer as you walk nearer to the sphere. 
    const sphere = new THREE.SphereGeometry( 1, 1, 1 );
    const material_sphere = new THREE.MeshPhongMaterial( { color: 0xff2200 } );
    const mesh_sphere = new THREE.Mesh( sphere, material_sphere );
    this._scene.add( mesh_sphere );

    //All of the following is bringing in my models
    this._LoadAnimatedModel();
    this._LoadCuriosity(this._scene);
    this._LoadPerseverence(this._scene);
    this._LoadRoverImages(this._scene);
    this._LoadBench(this._scene);
    this._LoadObjectAdvanceadAstronaut(this._scene);
    this._LoadObjectMobilityAstronaut(this._scene);
    this._LoadObjectZ2Astronaut(this._scene);
    this._LoadSolarSystem(this._scene, this._threejs);

    //this is just getting the animation frame.
    this.requestAnimationFrame();


    //This is bringing in the Apollo11 video on the wall of the museum. 
    const video = document.getElementById('video');

    const videoTexture = new THREE.VideoTexture(video);
    const videoMaterial =  new THREE.MeshBasicMaterial( {map: videoTexture, side: THREE.FrontSide, toneMapped: false} );

    const screen = new THREE.PlaneGeometry(30, 10, 10);
    const videoScreen = new THREE.Mesh(screen, videoMaterial);
    this._scene.add(videoScreen);
    videoScreen.scale.set(5,5,5);
    video.play();
    videoScreen.position.set(-200, 20, -20);
    videoScreen.rotation.y = 1.57; 

    //This is bringing in that second video, on the opposing wall, that shows the investing in Nasa video, credited above. 
    const video2 = document.getElementById('video2');

    const videoTexture2 = new THREE.VideoTexture(video2);
    const videoMaterial2 =  new THREE.MeshBasicMaterial( {map: videoTexture2, side: THREE.FrontSide, toneMapped: false} );
    const screen2 = new THREE.PlaneGeometry(30, 10, 10);
    const videoScreen2 = new THREE.Mesh(screen2, videoMaterial2);
    this._scene.add(videoScreen2);
    videoScreen2.scale.set(5,5,5);
    video2.play();
    videoScreen2.position.set(160, 30, -10);
    videoScreen2.rotation.y = 30; 


  }
 

  //The model used here is from smoggyBeard from SketchFab, credited above. 
  //This brings in the animated solar system in the middle of the museum. 
  _LoadSolarSystem(scene, renderer) {
    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    loader.load('models/solar_system/scene.gltf', (gltf) => {
      gltf.scene.scale.set(55,55,55); //w, h , d
      gltf.scene.position.set(10, 15, 20);
      const animations = gltf.animations;
      let mixer = new THREE.AnimationMixer(gltf.scene.children[0]);
      const action = mixer.clipAction(animations[1]);
      action.play();
      scene.add( gltf.scene )
      animate();

    function animate() {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      mixer.update(delta);
    }
       
      });
  }


  //this brings in the curiosity rover, model provided by Nasa archives, credited above. 
  _LoadCuriosity(scene) {
    const loader = new GLTFLoader();
    loader.load('models/curiosity_glb/curiosity_glb.glb', (gltf) => {
      const clock = new THREE.Clock();
      const rover = gltf.scene;
      const animations = rover;

      gltf.scene.traverse(c => {
        c.castShadow = true;
      });


      rover.scale.set(10,8,10); //w, h , d
      let mixer = new THREE.AnimationMixer( rover );
      const delta = clock.getDelta();
      mixer.update( delta );
      rover.position.set(100, 0, 100);
      this._scene.add(rover);
       
      });
  }

  //same as curiosity, the Perseverance model is provided by NASA archives, credited above. 
  _LoadPerseverence(scene) {
    const loader = new GLTFLoader();
    loader.load('models/Perseverance.glb', (gltf) => {
      const clock = new THREE.Clock();
      const rover = gltf.scene;
      const animations = rover;

      gltf.scene.traverse(c => {
        c.castShadow = true;
      });
      rover.scale.set(10,8,10); //w, h , d
      
      let mixer = new THREE.AnimationMixer( rover );
      const delta = clock.getDelta();
      
      mixer.update( delta );

      rover.position.set(-100, 0, 120);
      rover.rotation.y = Math.PI ;
      this._scene.add(rover);
       
      });
  }

  //This bench is a model brought in by sketchfab, made by blue man group, under Creative Commons Attribution, credited above. 
  _LoadBench(scene) {
    const loader = new GLTFLoader();
    loader.load('models/bench/scene.gltf', (gltf) => {

      const bench = gltf.scene;
      const bench2 = gltf.scene;
      const bench3 = gltf.scene;

      gltf.scene.traverse(c => {
        c.castShadow = true;
      });
      bench.scale.set(50,20,20); 
     
      bench.position.set(-110, -5, -20);
      bench.rotation.y = 300;
      this._scene.add(bench);

       
      });
  }

  //this is bringing in the advanced crew escape suit object model, provided by NASA, credited above. 
  _LoadObjectAdvanceadAstronaut(scene){
    var mesh = null;
   var mtlLoader = new MTLLoader(); 
   mtlLoader.load('models/astronaut/advanced/acesjustforroomshow.mtl', function(materials){
     materials.preload();

     var objLoader = new OBJLoader();
     objLoader.setMaterials(materials);

     objLoader.load('models/astronaut/advanced/Advanced_Crew_Escape_Suit.obj', function(mesh){
       scene.add(mesh);
       mesh.scale.set(11,11,11); 
       mesh.position.set(90, 0, -10);
       mesh.rotation.y = 2;
     });
   });
  }

  //this is bringing in the mobility suit, provided by NASA, credited above. 
  _LoadObjectMobilityAstronaut(scene){
    var mesh = null;
   var mtlLoader = new MTLLoader(); 
   mtlLoader.load('models/astronaut/mobility/EMU.mtl', function(materials){
     materials.preload();

     var objLoader = new OBJLoader();
     objLoader.setMaterials(materials);

     objLoader.load('models/astronaut/mobility/EMU.obj', function(mesh){
       scene.add(mesh);
       mesh.scale.set(11,11,11); 
       mesh.position.set(90, 0, -80);
       mesh.rotation.y = 2;
     });
   });
  }


  //This is bringing int he Z2 suit, provided by NASA, credited above. 
  _LoadObjectZ2Astronaut(scene){
    var mesh = null;
   var mtlLoader = new MTLLoader(); 
   mtlLoader.load('models/astronaut/Z2/Z2.mtl', function(materials){
     materials.preload();

     var objLoader = new OBJLoader();
     objLoader.setMaterials(materials);

     objLoader.load('models/astronaut/Z2/Z2.obj', function(mesh){
       scene.add(mesh);
       mesh.scale.set(11,11,11); 
       mesh.position.set(140, 0, -120);
       mesh.rotation.y = 11;
     });
   });

  }

  //This is using the NASA APIs to add images to the walls behind the rover, and at the APOD exhibit. 
  _LoadRoverImages(scene) {

    //This is standard procedure for creating a block, in this case a wall, I just add 
    //texture which will include the image I want to use, and then a material, that will include that texture,
    const textureLoader = new THREE.TextureLoader();

    let material = new THREE.MeshPhongMaterial({color: 0x202020, });

    //then I have to specify the dimensions of the wall
    const boxWidth = 110;
    const boxHeight = 100;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const x = 10;

    //this provides the shape of the mesh, in this case a box
    let cube = new THREE.Mesh(geometry, material);

    //This key should really be hidden, and I will likely do that next. I made the githib private so it's not avialable to view by the public. 
    const url = 'https://api.nasa.gov/planetary/apod?api_key=';
        const mars_url = 'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=';
        const api_key = 'cm0L1KcJd8Zluix80cXKD2T0MOqXq1QWyEkMhb1X';
        let data;
        let data_mars;

        //fetching the NASA API data. I had to use Express.js and Axios - in the apod-proxy-main folder, to bypass the CORS issues I was having.
        const fetchNASAData = async () => {
            try {
                const response = await fetch(`${url}${api_key}`);
                const response_mars = await fetch(`${mars_url}${api_key}`);
                data_mars = await response_mars.json();
                data = await response.json();
                //I am leaving these commented out lines in case I need to troubleshoot later, and can't remember how I did  it, lol
                // console.log("DATA " + data);
                // console.log('NASA Mars data', data_mars);

      //so to use my Express.js/Axios set up, I have add this to the front of the NASA data. 
      const str1 = "http://localhost:3000/apod-proxy?url=";
      const apod = data.url;
      const mars = data_mars.photos[0].img_src;

      //basically bringing in that mars data
      textureLoader.load(str1.concat(mars),
        function (texture) {
          texture.minFilter = THREE.NearestFilter;
          material = new THREE.MeshLambertMaterial({ map: texture });
          cube = new THREE.Mesh(geometry, material);
          scene.add(cube);
          cube.position.set(90, 20, 140);
        }

      );


      //going through the above steps again for the APOD picture. 
      const boxWidth = 150;
      const boxHeight = 100;
      const boxDepth = 1;
      var imgSrc = apod;
      var mesh;
      let width, height; 
 

      var tex = new THREE.TextureLoader().load(str1.concat(data.url), (tex) => {
        tex.needsupdate = true;
        width = tex.image.width;
        height = tex.image.height;
      });

      var material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: tex
      });

      const geometry4 = new THREE.BoxGeometry(width, height, boxDepth);
      mesh = new THREE.Mesh(geometry4, material);
       mesh.scale.x = 100;
       mesh.scale.y = 100;
       mesh.position.set(-30, 30, 150);
      scene.add(mesh);


      this._loadText(scene, data, data_mars);
            } catch (error) {
                console.log(error);
            }
        }

      //actually getting the NASA data. 
      fetchNASAData();

      //going through the above steps again for the curiosity parts image, credited above. 
      const boxWidth2 = 60;
      const boxHeight2 = 50;
      const boxDepth2 = 10;
      const geometry2 = new THREE.BoxGeometry(boxWidth2, boxHeight2, boxDepth2);

      let cube2 = new THREE.Mesh(geometry2, material);
      textureLoader.load("images/curiosity_webp.jpg",
        function (texture) {
          texture.minFilter = THREE.NearestFilter;
           let material2 = new THREE.MeshLambertMaterial({ map: texture });
          cube2 = new THREE.Mesh(geometry2, material2);
          scene.add(cube2);
          cube2.rotation.y = 95 ;
          cube2.position.set(150, 25, 120);
        }

      );

      //going through the steps again for the image behind the perseverence rover. 
      const boxWidth3 = 80;
      const boxHeight3 = 80;
      const boxDepth3 = 2;
      const geometry3 = new THREE.BoxGeometry(boxWidth3, boxHeight3, boxDepth3);

      let cube3 = new THREE.Mesh(geometry3, material);
      textureLoader.load("images/perseverence_rocks.gif",
        function (texture) {
          texture.minFilter = THREE.NearestFilter;
           let material3 = new THREE.MeshLambertMaterial({ map: texture });
          cube3 = new THREE.Mesh(geometry3, material3);
          scene.add(cube3);
          cube3.rotation.y = 40 ;
          cube3.position.set(-150, 30, 120);
        }

      );
  }

//Here I will create all the 3D text you see in the museum. 
_loadText(scene, data, data_mars){

    //This font loader is provided by Three.js
    var fontLoader = new THREE.FontLoader();
    //I'm bringing this back in because I will be using the API data to make dynamic text. 
    const str1 = "http://localhost:3000/apod-proxy?url=";
    //I got this font from : https://unpkg.com/browse/three@0.77.0/examples/fonts/ at UNPKG.com, seems like a commonly used font in Three.js community. 
    fontLoader.load("fonts/helvetiker_bold.typeface.json",function(tex){ 
    var  textGeo = new THREE.TextGeometry('Curiosity Rover', {
            size: 5,
            height: 1,
            curveSegments: 6,
            font: tex,
    });
    var  color = new THREE.Color();
    color.setRGB(255, 250, 250);
    var  textMaterial = new THREE.MeshBasicMaterial({ color: color });
    var  text = new THREE.Mesh(textGeo , textMaterial);
    text.position.set(80, 1, 100);
    text.rotation.y = 3.14;
    text.scale.x = 1.5;
    scene.add(text);
  });

    fontLoader.load("fonts/helvetiker_bold.typeface.json",function(tex){ 
      console.log("Title" + data.title);

    //APOD text
    var textGeo = new THREE.TextGeometry(data.title, {
            size: 5,
            height: 5,
            curveSegments: 6,
            font: tex,
    });

    //Museum text
    var museum = new THREE.TextGeometry('Space Museum', {
            size: 20,
            height: 1,
            curveSegments: 6,
            font: tex,
    });

    //Perseverance text
    var perseverence = new THREE.TextGeometry('Perseverence', {
            size: 5,
            height: 1,
            curveSegments: 6,
            font: tex,
    });

    //advanced crew escape suit font
    var advance = new THREE.TextGeometry('Advance Crew Escape Suit', {
            size: 2,
            height: 1,
            curveSegments: 12,
            font: tex,
    });

    //extravehicular mobility unit text
    var mobility = new THREE.TextGeometry('Extravehicular Mobility Unit', {
            size: 2,
            height: 1,
            curveSegments: 12,
            font: tex,
    });

    //Z2 suit text
    var Z2 = new THREE.TextGeometry('Z2 Spacesuit', {
            size: 2,
            height: 1,
            curveSegments: 12,
            font: tex,
    });

    //Apoll11 video text
    var Apollo11 = new THREE.TextGeometry('Apollo 11 Moon Landing', {
            size: 2,
            height: 1,
            curveSegments: 12,
            font: tex,
    });

    //creating a new color scheme for giant museum text font
    var color = new THREE.Color();
    color.setRGB(255, 250, 250);
    var textMaterial = new THREE.MeshBasicMaterial({ color: color });
    var text = new THREE.Mesh(textGeo , textMaterial);
    text.position.set(1, 1, 140);
    text.rotation.y = 3.14;
    text.scale.x = 1;

    //giant museum text
    var museum_text_color = new THREE.Color("rgb(34,34,68)");
    var textMaterialMuseum = new THREE.MeshBasicMaterial({ color: museum_text_color });
    var museum_text = new THREE.Mesh(museum, textMaterialMuseum);
    museum_text.position.set(60, 3, -100);
    museum_text.rotation.y = 3.14;
    museum_text.scale.x = 1;

    //perseverence
    var perseverence_color = new THREE.Color("rgb(255, 250, 250)");
    var textMaterialPerseverence = new THREE.MeshBasicMaterial({ color: perseverence_color });
    var perseverence_text = new THREE.Mesh(perseverence, textMaterialPerseverence);
    perseverence_text.position.set(-80, 1, 100);
    perseverence_text.rotation.y = 3.14;
    perseverence_text.scale.x = 1.5;

    //advanced crew escape suit
    var advancesuit_color = new THREE.Color("rgb(255, 250, 250)");
    var textMaterialAdvanceSuit = new THREE.MeshBasicMaterial({ color: advancesuit_color });
    var advance_text = new THREE.Mesh(advance, textMaterialAdvanceSuit);
    advance_text.position.set(130, 0, -30); 
    advance_text.rotation.y = 5;

    //Extravehicular Mobility Unit
    var mobility_color = new THREE.Color("rgb(255, 250, 250)");
    var textMaterialMobility = new THREE.MeshBasicMaterial({ color: mobility_color });
    var mobility_text = new THREE.Mesh(mobility, textMaterialMobility);
   mobility_text.position.set(130, 0, -80); 
   mobility_text.rotation.y = 5;
   advance_text.scale.x = 1.5;

    //Z2 Spacesuit
   var z2_color = new THREE.Color("rgb(255, 250, 250)");
   var textMaterialZ2= new THREE.MeshBasicMaterial({ color: z2_color });
   var z2_text = new THREE.Mesh(Z2, textMaterialZ2);
   z2_text.position.set(130, 0, -120); 
   z2_text.rotation.y = 5;
   z2_text.scale.x = 1.5;

   
    //Apollo11
   var ap_color = new THREE.Color("rgb(255, 250, 250)");
   var textMaterialAP= new THREE.MeshBasicMaterial({ color: ap_color });
   var ap_text = new THREE.Mesh(Apollo11, textMaterialAP);
   ap_text.position.set(130, 50, -70); 
   ap_text.rotation.y = 5;
   ap_text.scale.x = 1.5;


   // text.scale.y = 0.5;
    scene.add(text);
    scene.add(museum_text);
    scene.add(perseverence_text);
    scene.add(advance_text);
    scene.add(mobility_text);
    scene.add(z2_text);
    scene.add(ap_text);

});
}
