const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');
/**
 * @swagger
 * /api/ai/analyze/{subtitleId}:
 *   post:
 *     summary: Analyze subtitles and generate logical chapter timestamps using Gemini AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subtitleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subtitle to analyze
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chapterCount:
 *                 type: integer
 *                 description: Optional number of chapters to generate
 *                 example: 7
 *     responses:
 *       200:
 *         description: Analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subtitleId:
 *                   type: string
 *                 videoId:
 *                   type: string
 *                 videoTitle:
 *                   type: string
 *                 analysisId:
 *                   type: string
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         example: "00:00"
 *                       title:
 *                         type: string
 *                         example: "Introduction"
 *       400:
 *         description: Invalid request (e.g., missing subtitle ID)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Subtitle not found
 *       500:
 *         description: Server error during subtitle analysis
 */
router.post('/analyze/:subtitleId', authenticateToken, aiController.analyzeSubtitles);

/**
 * @swagger
 * /api/ai/analyses:
 *   get:
 *     summary: List all subtitle analyses for the user
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of analyses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   chapters:
 *                     type: array
 *                   subtitles:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       video_id:
 *                         type: string
 *                       video_title:
 *                         type: string
 *                       language:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/analyses', authenticateToken, aiController.listAnalyses);

/**
 * @swagger
 * /api/ai/analyses/{analysisId}:
 *   get:
 *     summary: Get a specific subtitle analysis
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the analysis to retrieve
 *     responses:
 *       200:
 *         description: Analysis details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                 chapters:
 *                   type: array
 *                 subtitles:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     video_id:
 *                       type: string
 *                     video_title:
 *                       type: string
 *                     language:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Analysis not found
 *       500:
 *         description: Server error
 */
router.get('/analyses/:analysisId', authenticateToken, aiController.getAnalysis);

/**
 * @swagger
 * /api/ai/regenerate/{subtitleId}:
 *   post:
 *     summary: Regenerate chapters for existing subtitles
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subtitleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subtitle to regenerate chapters for
 *     responses:
 *       200:
 *         description: Chapters regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subtitleId:
 *                   type: string
 *                 videoId:
 *                   type: string
 *                 videoTitle:
 *                   type: string
 *                 analysisId:
 *                   type: string
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                       title:
 *                         type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subtitles not found
 *       500:
 *         description: Server error
 */
router.post('/regenerate/:subtitleId', authenticateToken, aiController.regenerateChapters);

module.exports = router; 