import { userSettings } from './shared/user-settings.js';
import { getCurrentProfile, profiles } from './shared/profile.js';

/**
 * Initializes UI for visualizer
 * @param  {...Promise} profileSpecificInitialization Extra promises for initializing, this is used for profile specific initializations
 */
async function initalize (...profileSpecificInitialization) {
  return await Promise.all([
    // Technically most of these gets imported indirectly through the UI initialization, but we import them here for explicitness
    import("./ui/global.js"), // Load global UI elements
    import("./visualizer.js"), // Load visualizer logic
    import("./shortcuts.js"), // Load keyboard shortcuts
    ...profileSpecificInitialization
  // eslint-disable-next-line no-unused-vars
  ]).then(([globalUI, _visualizer, _shortcuts]) => {
    // If banner is enabled load it in and show startup message
    if(userSettings.showBanner) {
      import("./ui/banner.js").then(({ showBanner }) => {
        showBanner("Visualizer started; Press F2 to show settings.");
      });
    }

    // This is the screen resizing logic, it doesn't really have a spot so this is where it's ended up
    import('./visualizers/bar-vis.js').then(({ calcBars }) => {
      function updateCanvasValues() {
        // Get the actual calculated size of the canvas (dictated by css) and set the hight and width attributes accordingly
        const canvasRect = globalUI.canvas.getBoundingClientRect();
        globalUI.canvas.setAttribute('height', canvasRect.height);
        globalUI.canvas.setAttribute('width', canvasRect.width);
        // Calculates values for bars visualization, this might not be the best spot for this
        calcBars();
      }
    
      // Initial setting of canvas values
      updateCanvasValues();
    
      // used as part of a debouncing timeout
      let updateGUITimeoutId = null;
    
      // Event handling for window resizing, we debounce this to avoid spamming our GUI rescaling logic when resizing the window
      window.addEventListener('resize', () => {
        window.clearTimeout(updateGUITimeoutId);
        updateGUITimeoutId = window.setTimeout(updateCanvasValues, 250);
      });
    });
  });
}

switch (await getCurrentProfile()) {
  case profiles.music:
    if (userSettings.allowYoutubeMusic) {
      await initalize(import("./ui/ytmusic.js"));
    }
    else {
      console.log("Visualizer is disabled for youtube music");
    }
    break;
  case profiles.youtube:
    if (userSettings.allowYoutube) {
      await initalize(import("./ui/youtube.js"));
    }
    else {
      console.log("Visualizer is disabled for youtube");
    }
    break;
  default:
    // we should never hit the default case, but if we do we log an error and continue like it's a default profile
    console.error("Invalid profile");
    // eslint-disable-next-line no-fallthrough
  case profiles.default:
    if (userSettings.allowOther) {
      await initalize(import("./ui/other.js"));
    }
    else {
      console.log("Visualizer is disabled for other");
    }
    break;
}
