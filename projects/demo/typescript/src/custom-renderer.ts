import videojs from 'video.js';
import '@kokotree-inc/videojs-upnext-plugin';

const player = videojs('video', {
  plugins: {},
  sources: [
    {
      src: 'https://vjs.zencdn.net/v/oceans.mp4',
      type: 'video/mp4'
    },
    {
      src: 'https://vjs.zencdn.net/v/oceans.webm',
      type: 'video/webm'
    }
  ]
});
player.autoplay(true);

(player as any).upnext({
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
  },
  render: (container: HTMLDivElement) => {
    container.innerHTML = `<div class='vjs-upnext-container' data-vjs-upnext-container>
      <h2>Custom Up Next</h2>
      <p>This is a custom rendered Up Next card.</p>
      <button data-vjs-upnext-play>Play Next</button>
      <button data-vjs-upnext-cancel>Cancel</button>
    </div>`;
    return () => {
      console.log('Custom cleanup on remove');
    };
  }
});

player.on('ready', () => {
  console.log('ready');

  console.log(videojs.getPlugins());

  console.log('Upnext plugin version:', videojs.getPluginVersion('upnext'));
});
