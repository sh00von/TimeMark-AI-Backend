const supabase = require('../config/supabase');
const { logger } = require('../utils/logger');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Creates a formatted prompt for the Gemini model to generate video chapters.
 * @param {string} transcript - The video transcript content.
 * @param {number|string} [chapterCount] - The desired number of chapters.
 * @returns {string} The formatted prompt string.
 */
const createChapterPrompt = (transcript, chapterCount) => {
  // Default instruction if no specific chapter count is requested.
  let chapterInstruction = `Keep the number of chapters between 5-10, only creating new chapters when there's a significant topic change.`;
  let guidelines = `- Maximum 10 chapters`;

  // If a specific, valid chapter count is provided, update the instruction.
  const count = parseInt(chapterCount, 10);
  if (!isNaN(count) && count > 0) {
    chapterInstruction = `Create exactly ${count} logical chapters.`;
    guidelines = `- Create exactly ${count} chapters`;
  }

  return `Analyze the following video transcript and create a minimal set of logical chapters. Focus only on major topic transitions and key points.
${chapterInstruction}
Format the response as a JSON array of objects with 'timestamp' and 'title' properties.
Example format:
[
  {"timestamp": "00:00", "title": "Introduction"},
  {"timestamp": "02:30", "title": "Main Topic"},
  {"timestamp": "05:45", "title": "Conclusion"}
]
Guidelines:
- Create only essential chapters
- Use clear, concise titles
- Only include timestamps for significant topic changes
- Avoid creating too many small chapters
${guidelines}

Here's the transcript:

${transcript}`;
};

const analyzeSubtitles = async (req, res) => {
  try {
    const { subtitleId } = req.params;
    // Destructure chapterCount from the request body.
    const { chapterCount } = req.body;

    if (!subtitleId) {
      return res.status(400).json({ error: 'Subtitle ID is required' });
    }

    // Get subtitles from database
    const { data: subtitles, error: fetchError } = await supabase
      .from('subtitles')
      .select('*')
      .eq('id', subtitleId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) {
      logger.error('Error fetching subtitles:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch subtitles' });
    }

    if (!subtitles) {
      return res.status(404).json({ error: 'Subtitles not found' });
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('subtitle_analysis')
      .select('*')
      .eq('subtitle_id', subtitleId)
      .single();

    if (existingAnalysis) {
      return res.json({
        subtitleId: subtitles.id,
        videoId: subtitles.video_id,
        videoTitle: subtitles.video_title,
        analysisId: existingAnalysis.id,
        chapters: existingAnalysis.chapters
      });
    }

    // Prepare prompt for Gemini using the helper function
    const prompt = createChapterPrompt(subtitles.content, chapterCount);

    // Get analysis from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    const response = await result.response;
    const analysis = response.text();

    // Parse the JSON response
    const chapters = JSON.parse(analysis);

    // Store analysis in database
    const { data: storedAnalysis, error: storeError } = await supabase
      .from('subtitle_analysis')
      .insert({
        subtitle_id: subtitleId,
        user_id: req.user.id,
        chapters: chapters,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (storeError) {
      logger.error('Error storing analysis:', storeError);
      return res.status(500).json({ error: 'Failed to store analysis' });
    }

    res.json({
      subtitleId: subtitles.id,
      videoId: subtitles.video_id,
      videoTitle: subtitles.video_title,
      analysisId: storedAnalysis.id,
      chapters
    });

  } catch (error) {
    logger.error('Subtitle analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze subtitles',
      details: error.message
    });
  }
};

const listAnalyses = async (req, res) => {
  try {
    const { data: analyses, error } = await supabase
      .from('subtitle_analysis')
      .select(`
        id,
        created_at,
        chapters,
        subtitles (
          id,
          video_id,
          video_title,
          language
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching analyses:', error);
      return res.status(500).json({ error: 'Failed to fetch analyses' });
    }

    res.json(analyses);

  } catch (error) {
    logger.error('List analyses error:', error);
    res.status(500).json({ error: 'Failed to list analyses' });
  }
};

const getAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    const { data: analysis, error } = await supabase
      .from('subtitle_analysis')
      .select(`
        id,
        created_at,
        chapters,
        subtitles (
          id,
          video_id,
          video_title,
          language
        )
      `)
      .eq('id', analysisId)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      logger.error('Error fetching analysis:', error);
      return res.status(500).json({ error: 'Failed to fetch analysis' });
    }

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);

  } catch (error) {
    logger.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
};

const regenerateChapters = async (req, res) => {
  try {
    const { subtitleId } = req.params;
    // Destructure chapterCount from the request body.
    const { chapterCount } = req.body;

    if (!subtitleId) {
      return res.status(400).json({ error: 'Subtitle ID is required' });
    }

    // Get subtitles from database
    const { data: subtitles, error: fetchError } = await supabase
      .from('subtitles')
      .select('*')
      .eq('id', subtitleId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError) {
      logger.error('Error fetching subtitles:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch subtitles' });
    }

    if (!subtitles) {
      return res.status(404).json({ error: 'Subtitles not found' });
    }

    // Prepare prompt for Gemini using the helper function
    const prompt = createChapterPrompt(subtitles.content, chapterCount);

    // Get analysis from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    const response = await result.response;
    const analysis = response.text();

    // Parse the JSON response
    const chapters = JSON.parse(analysis);

    // Update existing analysis or create new one
    const { data: existingAnalysis } = await supabase
      .from('subtitle_analysis')
      .select('id')
      .eq('subtitle_id', subtitleId)
      .single();

    let storedAnalysis;
    if (existingAnalysis) {
      // Update existing analysis
      const { data, error: updateError } = await supabase
        .from('subtitle_analysis')
        .update({
          chapters: chapters,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAnalysis.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating analysis:', updateError);
        return res.status(500).json({ error: 'Failed to update analysis' });
      }
      storedAnalysis = data;
    } else {
      // Create new analysis
      const { data, error: insertError } = await supabase
        .from('subtitle_analysis')
        .insert({
          subtitle_id: subtitleId,
          user_id: req.user.id,
          chapters: chapters,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error storing analysis:', insertError);
        return res.status(500).json({ error: 'Failed to store analysis' });
      }
      storedAnalysis = data;
    }

    res.json({
      subtitleId: subtitles.id,
      videoId: subtitles.video_id,
      videoTitle: subtitles.video_title,
      analysisId: storedAnalysis.id,
      chapters
    });

  } catch (error) {
    logger.error('Chapter regeneration error:', error);
    res.status(500).json({
      error: 'Failed to regenerate chapters',
      details: error.message
    });
  }
};

module.exports = {
  analyzeSubtitles,
  listAnalyses,
  getAnalysis,
  regenerateChapters
};
