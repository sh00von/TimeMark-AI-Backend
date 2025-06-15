const express = require('express');
const router = express.Router();
const subtitleController = require('../controllers/subtitleController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     SubtitleExtractResponse:
 *       type: object
 *       properties:
 *         videoId:
 *           type: string
 *         subtitles:
 *           type: string
 *         userId:
 *           type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/subtitles/extract:
 *   post:
 *     summary: Extract subtitles from a YouTube video
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: YouTube video URL
 *     responses:
 *       200:
 *         description: Subtitles extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: string
 *                 videoTitle:
 *                   type: string
 *                 subtitles:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/extract', authenticateToken, subtitleController.extractSubtitles);

/**
 * @swagger
 * /api/subtitles/videos:
 *   get:
 *     summary: List all videos with subtitles for the user
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   video_id:
 *                     type: string
 *                   video_title:
 *                     type: string
 *                   language:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   is_auto_generated:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/videos', authenticateToken, subtitleController.listVideos);

module.exports = router; 