const supabase = require('../config/supabase');
const { logger } = require('../utils/logger');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');

const preprocessSubtitles = (content) => {
  // Split into lines and process
  const lines = content.split('\n');
  const processedLines = [];
  let currentText = '';
  let currentTime = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and line numbers
    if (!line || /^\d+$/.test(line)) continue;
    
    // If line contains timestamp
    if (line.includes('-->')) {
      currentTime = line;
      continue;
    }
    
    // If line contains text
    if (line && !line.includes('-->')) {
      // Remove extra spaces and normalize text
      currentText = line.replace(/\s+/g, ' ').trim();
      if (currentTime) {
        processedLines.push(`${currentTime}\n${currentText}`);
        currentTime = '';
        currentText = '';
      }
    }
  }

  return processedLines.join('\n\n');
};

const extractSubtitles = async (req, res) => {
  try {
    const { url } = req.body;
    const lang = req.query.lang || 'en';

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract video ID from URL
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    logger.info('Extracted video ID:', { videoId });

    // Check if subtitles already exist
    const { data: existingSubtitles, error: checkError } = await supabase
      .from('subtitles')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', req.user.id)
      .eq('language', lang);

    if (checkError) {
      logger.error('Error checking existing subtitles:', checkError);
      return res.status(500).json({ error: 'Failed to check existing subtitles' });
    }

    if (existingSubtitles && existingSubtitles.length > 0) {
      const subtitle = existingSubtitles[0];
      return res.json({
        id: subtitle.id
      });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const basePath = path.join(tempDir, videoId);

    // Get video info first
    const videoInfo = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });

    const videoTitle = videoInfo.title;

    // Fetch subtitles using youtube-dl-exec
    await youtubedl(url, {
      skipDownload: true,
      writeAutoSub: true,
      subFormat: 'vtt',
      subLang: lang,
      output: basePath
    });

    // Try both .vtt and .srt extensions
    const subtitlePathVtt = `${basePath}.${lang}.vtt`;
    const subtitlePathSrt = `${basePath}.${lang}.srt`;
    
    let rawSubtitleContent = '';
    try {
      // Try VTT first
      rawSubtitleContent = fs.readFileSync(subtitlePathVtt, 'utf8');
      // Clean up temp file
      fs.unlinkSync(subtitlePathVtt);
    } catch (vttError) {
      try {
        // If VTT fails, try SRT
        rawSubtitleContent = fs.readFileSync(subtitlePathSrt, 'utf8');
        // Clean up temp file
        fs.unlinkSync(subtitlePathSrt);
      } catch (srtError) {
        logger.error('Failed to read subtitle files:', { vttError, srtError });
        return res.status(404).json({ error: 'No subtitles found for this video' });
      }
    }

    if (!rawSubtitleContent) {
      return res.status(404).json({ error: 'No subtitles found for this video' });
    }

    // Preprocess subtitles
    const processedContent = preprocessSubtitles(rawSubtitleContent);

    // Save to database
    const { data: savedSubtitles, error: saveError } = await supabase
      .from('subtitles')
      .insert({
        user_id: req.user.id,
        video_id: videoId,
        video_title: videoTitle,
        language: lang,
        content: processedContent,
        is_auto_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id');

    if (saveError) {
      logger.error('Error saving subtitles:', saveError);
      return res.status(500).json({ error: 'Failed to save subtitles' });
    }

    if (!savedSubtitles || savedSubtitles.length === 0) {
      return res.status(500).json({ error: 'Failed to save subtitles' });
    }

    const savedSubtitle = savedSubtitles[0];
    res.json({
      id: savedSubtitle.id
    });

  } catch (error) {
    logger.error('Subtitle extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract subtitles',
      details: error.message 
    });
  }
};

const listVideos = async (req, res) => {
  try {
    const { data: videos, error } = await supabase
      .from('subtitles')
      .select(`
        id,
        video_id,
        video_title,
        language,
        created_at,
        is_auto_generated
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching videos:', error);
      return res.status(500).json({ error: 'Failed to fetch videos' });
    }

    res.json(videos);

  } catch (error) {
    logger.error('List videos error:', error);
    res.status(500).json({ error: 'Failed to list videos' });
  }
};

module.exports = {
  extractSubtitles,
  listVideos
}; 