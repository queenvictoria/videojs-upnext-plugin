import videojs, { VideoJsPlayer } from 'video.js';

import { PLUGIN_VERSION } from './version';
import './upnext-styles.css';

// Get the plugin and component classes from video.js
const Plugin = videojs.getPlugin('plugin');
const Component = videojs.getComponent('Component');

/**
 * Returns the HTML for the upnext template.
 * @param options - The options for the upnext template.
 * @returns The HTML for the upnext template.
 */
const getUpnextTemplate = (options: VideoJsUpnextPluginOptions) => {
  return `
<div class="vjs-upnext-overlay"></div>
<div class="vjs-upnext-container" data-vjs-upnext-container>
  <div class="vjs-upnext-header-container"><span class="vjs-upnext-header-title">${options.headText}</span></div>
  <div class="vjs-play-next-container" data-vjs-upnext-play>
    <div class="vjs-play-next-banner-container">
      <div class="img"></div>
    </div>
    <div class="vjs-upnext-title">${options.getTitle()}</div>
    <div class="vjs-upnext-progress-container" data-vjs-upnext-progress>
      <svg viewBox="0 0 90 90" preserveAspectRatio="xMinYMin meet">
        <circle class="vjs-upnext-progress-circle-background" cx="40" cy="40" r="40"></circle>
        <circle id="vjs-upnext-progress-circle" class="vjs-upnext-progress-circle" cx="40" cy="40" r="40"></circle>
          <svg viewBox="0 0 24 24" width="60" height="80">
            <path transform="rotate(90 12 12) translate(1,-4)" fill="#fff" d="M8 5v14l11-7z"></path>
          </svg>
      </svg>
    </div>
  </div>
    <div class="vjs-upnext-cancel-button" data-vjs-upnext-cancel><a title="${options.cancelText}">x</a></div>
</div>
    `;
};

/**
 * The component that displays the upnext overlay.
 */
export class UpnextCard extends Component {
  /**
   * The Video.js player instance.
   */
  videoJsPlayer: VideoJsPlayer;

  /**
   * The plugin options.
   */
  pluginOptions: VideoJsUpnextPluginOptions;

  /**
   * Data selectors for the upnext controls.
   */
  controlSelectors = {
    /**
     * The upnext container selector.
     */
    upnextContainer: '[data-vjs-upnext-container]',

    /**
     * The upnext cancel button attribute name.
     */
    upnextCancel: '[data-vjs-upnext-cancel]',

    /**
     * The play next container attribute name.
     */
    upnextPlayContainer: '[data-vjs-upnext-play]',

    /**
     * The upnext progress circle attribute name.
     */
    upnextProgress: '[data-vjs-upnext-progress]'
  };

  /**
   * The ID of the current timeout that is waiting to execute.
   *
   * @type {any}
   */
  private timeoutId: any;

  /**
   * Optional cleanup callback returned by a custom `render` function.
   */
  private renderCleanup: (() => void) | null = null;

  /**
   * Constructs a new instance of the UpnextCard component.
   * @param videoJsPlayer - The video.js player instance.
   * @param pluginOptions - The options for the upnext plugin.
   * @param componentOptions - The component options.
   */
  constructor(videoJsPlayer: VideoJsPlayer, pluginOptions: VideoJsUpnextPluginOptions, componentOptions: videojs.ComponentOptions) {
    super(videoJsPlayer, componentOptions);

    this.videoJsPlayer = videoJsPlayer;
    this.pluginOptions = pluginOptions;

    this.on(this.videoJsPlayer, 'ended', this.handleVideoEnded);
  }

  /**
   * Toggles the video controls on or off.
   * @param enabled - Whether or not to enable the controls.
   */
  private toggleControls = (enabled: boolean) => {
    console.log('toggleControls', enabled);
    this.videoJsPlayer.controls(enabled);
  };

  /**
   * Removes the upnext control and toggles video player controls on.
   * @param upnextContainer - The upnext control element to be removed.
   */
  private removeUpnextControl = (upnextContainer: HTMLDivElement) => {
    // If a custom render returned a cleanup function, call it before removing DOM
    if (this.renderCleanup) {
      try {
        this.renderCleanup();
      } catch (_e) {
        // swallow errors during cleanup
      }
      this.renderCleanup = null;
    }

    upnextContainer.remove();
    this.toggleControls(true);
    clearTimeout(this.timeoutId);
  };

  /**
   * Plays the next video and removes the upnext control.
   * @param upnextContainer - The upnext control element to be removed.
   */
  private playNext = (upnextContainer: HTMLDivElement) => {
    const { pluginOptions, removeUpnextControl } = this;

    pluginOptions.playNext();
    removeUpnextControl(upnextContainer);
  };

  /**
   * Handles the "ended" event on the video player. Displays the upnext card and starts the countdown timer
   * until the next video plays.
   */
  private handleVideoEnded = () => {
    console.log('Video ended');

    const { videoJsPlayer, pluginOptions } = this;

    // Create the upnext card element
    const upnextContainer = document.createElement('div');
    upnextContainer.className = 'vjs-upnext-root';
    upnextContainer.style.setProperty('--video-image-url', `url(${pluginOptions.getVideoImageUrl()})`);

    // If a consumer provides a `render` function, call it and store an
    // optional cleanup callback it may return. Otherwise fall back to
    // the original string-template rendering.
    if (pluginOptions.render) {
      try {
        const maybeCleanup = pluginOptions.render(upnextContainer, pluginOptions);
        if (typeof maybeCleanup === 'function') {
          this.renderCleanup = maybeCleanup;
        }
      } catch (_err) {
        // On error fall back to default template
        upnextContainer.innerHTML = getUpnextTemplate(pluginOptions);
      }
    } else {
      upnextContainer.innerHTML = getUpnextTemplate(pluginOptions);
    }

    videoJsPlayer.el().appendChild(upnextContainer);

    // If a consumer provided a render function it may mount asynchronously
    // (e.g. React). Delay setup to the next animation frame so mounts can
    // complete. For the default template we run setup synchronously.
    if (pluginOptions.render) {
      setTimeout(() => this.setupInteractions(upnextContainer), 50);
    } else {
      this.setupInteractions(upnextContainer);
    }
  };

  /**
   * Set up the behaviours and listeners for the upnext control.
   *
   * @param upnextContainer - The upnext control element.
   * @returns void
   */
  private setupInteractions = (upnextContainer: HTMLDivElement) => {
    const { pluginOptions, toggleControls, removeUpnextControl, controlSelectors, playNext } = this;

    // Set the animation duration of the progress circle
    const progress = upnextContainer.querySelector(this.controlSelectors.upnextProgress) as SVGCircleElement | null;
    if (progress) {
      progress.style.setProperty('--progress-animation-duration', `${pluginOptions.interval}s`);
      console.log('animateProgressCircle');
    }

    // Start the countdown timer until the next video plays
    this.timeoutId = setTimeout(() => {
      playNext(upnextContainer);
    }, pluginOptions.interval * 1000);

    // Hide the controls during the countdown
    toggleControls(false);

    // Handle click events on the close button of the upnext card
    const nextClose = upnextContainer.querySelector(controlSelectors.upnextCancel);
    if (nextClose) {
      // Cancel the timeout using the ID

      nextClose.addEventListener('click', () => {
        console.log('Close clicked');
        pluginOptions.cancel();
        removeUpnextControl(upnextContainer);
      });
    }

    // Handle click events on the play next button of the upnext card
    const playNextContainer = upnextContainer.querySelector(controlSelectors.upnextPlayContainer);
    if (playNextContainer) {
      // Cancel the timeout using the ID
      playNextContainer.addEventListener('click', () => {
        console.log('Play next clicked');
        playNext(upnextContainer);
      });
    }
  };
}

/**
 * Registers the UpnextCard component with Video.js
 *
 * @param {string} name - The name to use when registering the component
 * @param {typeof UpnextCard} component - The component to register
 */
videojs.registerComponent('UpnextCard', UpnextCard);

/**
 * A Video.js plugin that displays an up-next card at the end of a video.
 */
export class VideoJsUpnextPlugin extends Plugin {
  /**
   * The version number of the plugin.
   */
  public static VERSION = PLUGIN_VERSION;

  /**
   * The default options for the plugin.
   */
  defaultOptions: VideoJsUpnextPluginOptions = {
    interval: 20,
    headText: 'Up Next',
    cancelText: 'Cancel',
    getTitle: function (): string {
      throw new Error('Function not implemented.');
    },
    playNext: function (): void {
      throw new Error('Function not implemented.');
    },
    cancel: function (): void {
      throw new Error('Function not implemented.');
    },
    getVideoImageUrl: function (): string {
      throw new Error('Function not implemented.');
    }
  };

  /**
   * Constructs an instance of the plugin.
   *
   * @param player The Video.js player object.
   * @param options The plugin options.
   */
  constructor(player: VideoJsPlayer, options?: VideoJsUpnextPluginOptions) {
    super(player);

    const mergedOptions = videojs.mergeOptions(this.defaultOptions, options);

    player.ready(() => this.onPlayerReady(player, mergedOptions));
  }

  /**
   * The event handler for when the player is ready.
   *
   * @param player The Video.js player object.
   * @param options The plugin options.
   */
  onPlayerReady = (player: VideoJsPlayer, options: VideoJsUpnextPluginOptions) => {
    console.log('onPlayerReady mergedOptions', options);

    // Create an instance of EndCard and add it to the player.
    const endCard = new UpnextCard(player, options, {});
    player.addChild(endCard);
  };
}

/**
 * Register the VideoJsUpnextPlugin with Video.js.
 */
videojs.registerPlugin('upnext', VideoJsUpnextPlugin);

/**
 * Extends the Video.js player interface to include the upnext plugin.
 */
declare module 'video.js' {
  export interface VideoJsPlayer {
    upnext: (options?: Partial<VideoJsUpnextPluginOptions>) => VideoJsUpnextPluginOptions;
  }
}

/**
 * Options for the Video.js Up Next plugin.
 */
export interface VideoJsUpnextPluginOptions {
  /**
   * The number of seconds to wait before showing the Up Next card.
   */
  interval: number;
  /**
   * The text to display in the Up Next card header.
   */
  headText: string;
  /**
   * The text to display in the Up Next card cancel button.
   */
  cancelText: string;
  /**
   * A function that returns the title of the next video.
   */
  getTitle: () => string;
  /**
   * A function that returns the URL of the thumbnail image of the next video.
   */
  getVideoImageUrl: () => string;
  /**
   * A function to call when the "play next" button in the Up Next card is clicked.
   */
  playNext: () => void;
  /**
   * A function to call when the Up Next card is closed or cancelled.
   */
  cancel: () => void;
  /**
   * Optional render hook for frameworks like React. If provided, the
   * function will be called with a container element where the consumer
   * should mount/render their UI. The function may return an optional
   * cleanup callback which will be invoked when the plugin removes the
   * upnext card.
   */
  render?: (container: HTMLElement, options?: VideoJsUpnextPluginOptions) => void | (() => void);
}

// console.log(videojs.getPlugins());
