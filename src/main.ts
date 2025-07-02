import { setEngine } from "./app/getEngine";
//import { LoadScreen } from "./app/screens/LoadScreen";
import { MainScreen } from "./app/screens/main/MainScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import "@pixi/sound";
// import "@esotericsoftware/spine-pixi-v8";

// Create a new creation engine instance
const engine = new CreationEngine();
setEngine(engine);

(async () => {
  // Initialize the creation engine instance
  await engine.init({
    resizeTo: window, // Resize the application to the window
   // width: 384, // Width of the application
   // height: 264,
    backgroundColor: 0x000000, // Background color
    antialias: true,     // Enable antialiasing
    resolution: 1,       // Resolution / device pixel ratio
    preference: 'webgl', // or 'webgpu' // Renderer preference
    sharedTicker : false, // Use a shared ticker
    autoStart: true, // Automatically start the ticker
  });

  // Initialize the user settings
  userSettings.init();

  // Show the load screen
  // await engine.navigation.showScreen(LoadScreen);
  // Show the main screen once the load screen is dismissed
  await engine.navigation.showScreen(MainScreen);
})();
