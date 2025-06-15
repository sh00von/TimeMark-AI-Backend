const youtubedl = require('youtube-dl-exec');

async function getSubtitles(url) {
  try {
    const result = await youtubedl(url, {
      skipDownload: true,
      writeAutoSub: true,
      subFormat: 'srt',
      subLang: 'en'
    });
    console.log('Subtitles downloaded successfully');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example usage
const videoUrl = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID';
getSubtitles(videoUrl);