# videojs-upnext-plugin

A plugin for [video.js](https://videojs.com/) that displays an "Up Next" overlay when a video finishes playing.

![Preview](https://github.com/Kokotree-Inc/videojs-upnext-plugin/blob/1b47bcb78d9c9d320f3424be2845998a32c38c69/assets/images/preview.gif?raw=true)

## Installation

Run `npm install @kokotree-inc/videojs-upnext-plugin` to install the plugin.

## Usage

To use this plugin, simply import it and register it with your video.js player instance:

index.js

```javascript
import videojs from 'video.js';
import '@kokotree-inc/videojs-upnext-plugin';

const player = videojs('my-player');

player.upnext({
  interval: 10,
  headText: 'Up Next',
  cancelText: 'Cancel',
  getTitle: () => {
    return 'Ocean Life';
  },
  getVideoImageUrl: () => {
    return 'https://vjs.zencdn.net/v/oceans.png';
  },
  playNext: () => {
    console.log('playNext');
  },
  cancel: () => {
    console.log('cancel');
  }
});
```

HTML

```html
<html>
  <head>
    <link href="http://vjs.zencdn.net/8.9.0/video-js.css" rel="stylesheet" />

    <link href="index.css" rel="stylesheet" />
    <link href="upnext-styles.min.css" rel="stylesheet" />
  </head>
  <body>
    <div class="vid-container">
      <div
        class="video-js vjs-default-skin video-js-upnext-demo-player vjs-fluid video-js-upnext-demo-player-video-dimensions vjs-controls-enabled">
        <video id="video" controls></video>
      </div>
    </div>
    <script src="./index.js"></script>
  </body>
</html>
```

You can get upnext-styles.min.css from the root of this package.

## Plugin Options

| Option             | Type       | Default                                                                           | Description                                                                                         |
| ------------------ | ---------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `interval`         | `number`   | `20`                                                                              | The interval, in seconds, before the next video starts playing.                                     |
| `headText`         | `string`   | `'Up Next'`                                                                       | The text displayed at the top of the Up Next card.                                                  |
| `cancelText`       | `string`   | `'Cancel'`                                                                        | The text displayed on the Cancel button.                                                            |
| `getTitle`         | `function` | `() => ''`                                                                        | A function that returns the title of the next video to be played.                                   |
| `getVideoImageUrl` | `function` | `() => ''`                                                                        | A function that returns the URL of the image to be displayed on the Up Next card.                   |
| `playNext`         | `function` | `() => {}`                                                                        | A function that is called when the user clicks the "Play Next" button.                              |
| `cancel`           | `function` | `() => {}`                                                                        | A function that is called when the user clicks the "Cancel" button.                                 |
| `render`           | `function` | `render?: (container: HTMLElement, options?: VideoJsUpnextPluginOptions) => void` | An option function that is called to render the UI component overriding the built in UI. See below. |

This plugin supports a `render` option that lets you mount a React (or other) UI into the upnext container.

- `container` — a DOM element already appended to the player where you should mount your UI. This is provided by the plugin.
- `options` — the plugin options passed to the renderer (helpers like `getTitle`, `playNext`, etc.).
- The `render` function may return an optional cleanup function which the plugin will call when removing the upnext card.

### render() example (React 18)

```tsx
import { createRoot } from 'react-dom/client';
import UpnextReact from './UpnextReact';

player.upnext({
  interval: 10,
  getTitle: () => 'Next video',
  getVideoImageUrl: () => '/thumb.jpg',
  playNext: () => {
    /* ... */
  },
  cancel: () => {
    /* ... */
  },

  render: (container, options) => {
    const root = createRoot(container);
    root.render(
      <UpnextReact
        title={options?.getTitle?.()}
        videoImageUrl={options?.getVideoImageUrl?.()}
        playNext={() => {
          options?.playNext?.();
        }}
        close={() => {
          options?.cancel?.();
        }}
      />
    );

    // return cleanup function to be called by the plugin
    return () => root.unmount();
  }
});
```

## Notes

- If `render` is not supplied the plugin will fall back to its default HTML template.
- Returning a cleanup function is recommended so resources are freed when the upnext card is removed.
- Keep component-specific CSS scoped inside your component or rely on the plugin's styles.

## Data-attribute selectors

The plugin exposes behavior hooks via `data-*` attributes on the default template so renderers
or consumers can target interactive elements without relying on presentational class names. If you
use the optional `render` hook you can query the container for these attributes and attach handlers
or mount UI as needed.

- `data-vjs-upnext-container`: the root upnext container element (on the same element that has `.vjs-upnext-container`).
- `data-vjs-upnext-play`: the play-next clickable area/button/container.
- `data-vjs-upnext-cancel`: the cancel/close button element.
- `data-vjs-upnext-progress-circle`: the SVG progress circle element (used by the plugin to animate countdown).

Example (React) — attach handlers or mount into the provided `container` element:

```ts
render: (container, options) => {
  // Find the play/cancel elements via data attributes
  const play = container.querySelector('[data-vjs-upnext-play]');
  const cancel = container.querySelector('[data-vjs-upnext-cancel]');

  // Attach eventlisteners (or use your framework event system)
  play?.addEventListener('click', () => options?.playNext?.());
  cancel?.addEventListener('click', () => options?.cancel?.());

  // If you mount a React tree, return a cleanup function to unmount it
  // return () => root.unmount();
},
```
