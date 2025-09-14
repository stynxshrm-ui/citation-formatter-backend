const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { searchCrossRefByDOI, searchCrossRefByTitle, searchSemanticScholarByTitle } = require('../services/apiService');
const { logger } = require('../utils/logger');

// DOI lookup endpoint
router.post('/lookup', [
  body('doi').isString().notEmpty().withMessage('DOI is required'),
  body('doi').matches(/^10\.\d{4,9}\/[-._;():A-Z0-9]+$/i).withMessage('Invalid DOI format')
], async(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { doi } = req.body;
    logger.info(`DOI lookup request: ${doi}`);

    // Try CrossRef first
    let paperData = await searchCrossRefByDOI(doi);

    // Fallback to Semantic Scholar if CrossRef fails
    if (!paperData) {
      logger.info(`CrossRef failed for DOI ${doi}, trying Semantic Scholar...`);
      paperData = await searchSemanticScholarByTitle(doi);
    }

    if (paperData) {
      res.json({
        success: true,
        data: paperData
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Paper not found'
      });
    }
  } catch (error) {
    logger.error('DOI lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Title search endpoint
router.post('/search', [
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('title').isLength({ min: 3, max: 500 }).withMessage('Title must be between 3 and 500 characters')
], async(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title } = req.body;
    logger.info(`Title search request: ${title}`);

    // Search both APIs
    const [semanticData, crossrefData] = await Promise.all([
      searchSemanticScholarByTitle(title),
      searchCrossRefByTitle(title)
    ]);

    // Combine and deduplicate results
    const allResults = [];
    if (semanticData) {
      if (Array.isArray(semanticData)) {
        allResults.push(...semanticData);
      } else {
        allResults.push(semanticData);
      }
    }

    if (crossrefData) {
      if (Array.isArray(crossrefData)) {
        allResults.push(...crossrefData);
      } else {
        allResults.push(crossrefData);
      }
    }

    // Remove duplicates based on title
    const uniqueResults = [];
    const seenTitles = new Set();

    for (const result of allResults) {
      const normalizedTitle = result.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueResults.push(result);
      }
    }

    // Sort by relevance
    const normalizedQuery = title.toLowerCase().trim();
    uniqueResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase().trim();
      const bTitle = b.title.toLowerCase().trim();

      // Exact match gets highest priority
      const aExact = aTitle === normalizedQuery;
      const bExact = bTitle === normalizedQuery;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then sort by how early the substring appears
      const aIndex = aTitle.indexOf(normalizedQuery);
      const bIndex = bTitle.indexOf(normalizedQuery);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // Finally, sort by year (newer first)
      const aYear = parseInt(a.year) || 0;
      const bYear = parseInt(b.year) || 0;
      return bYear - aYear;
    });

    // Limit to 10 results
    const limitedResults = uniqueResults.slice(0, 10);

    res.json({
      success: true,
      data: limitedResults,
      total: limitedResults.length
    });
  } catch (error) {
    logger.error('Title search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
