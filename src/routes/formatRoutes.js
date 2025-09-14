const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { formatCitation, formatBibTeX, formatEndNote } = require('../utils/citationFormatters');
const { searchCrossRefByDOI, searchCrossRefByTitle, searchSemanticScholarByTitle } = require('../services/apiService');
const { logger } = require('../utils/logger');

// DOI regex pattern
const doiRegex = /10\.\d{4,9}\/[-._;()\/:A-Z0-9]+/i;

// Optimized paper lookup with caching
async function lookupPaper(ref) {
  let paperData = null;
  
  try {
    // Smart API selection logic
    if (doiRegex.test(ref)) {
      const doi = ref.match(doiRegex)[0];
      logger.info(`Processing DOI: ${doi}`);
      
      paperData = await searchCrossRefByDOI(doi);
      
      // Fallback: if Crossref fails, try Semantic Scholar
      if (!paperData) {
        logger.info(`Crossref failed for DOI ${doi}, trying Semantic Scholar...`);
        paperData = await searchSemanticScholarByTitle(ref);
      }
    } else {
      // If input is a title → query both APIs and combine results
      logger.info(`Processing title: "${ref}"`);
      
      const [semanticData, crossrefData] = await Promise.all([
        searchSemanticScholarByTitle(ref),
        searchCrossRefByTitle(ref)
      ]);
      
      // Combine results from both APIs
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
      
      if (uniqueResults.length > 0) {
        // Sort by relevance
        const normalizedQuery = ref.toLowerCase().trim();
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
        
        // Limit to maximum 5 results
        const limitedResults = uniqueResults.slice(0, 5);
        
        paperData = limitedResults.length === 1 ? limitedResults[0] : limitedResults;
      }
    }
    
    return paperData;
  } catch (error) {
    logger.error(`Error processing reference "${ref}":`, error);
    return null;
  }
}

// Main formatting endpoint
router.post('/format', [
  body('references').isString().notEmpty().withMessage('References are required'),
  body('format').isIn(['apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee', 'ama', 'asa']).withMessage('Invalid format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { references, format = 'apa' } = req.body;
    
    // Split references by lines
    const lines = references.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return res.status(400).json({
        error: 'No valid references provided'
      });
    }

    const results = [];
    const notFound = [];
    const multipleMatches = [];
    const papers = [];
    
    // Process references with optimized lookup
    for (let i = 0; i < lines.length; i++) {
      const ref = lines[i];
      
      try {
        const paperData = await lookupPaper(ref);
        
        if (paperData) {
          // Check if paperData is an array (multiple matches)
          if (Array.isArray(paperData)) {
            logger.info(`Multiple matches found for "${ref}", adding to selection list`);
            multipleMatches.push({
              index: i,
              query: ref,
              options: paperData.map((paper, optIndex) => ({
                id: optIndex,
                title: paper.title,
                authors: paper.authors,
                journal: paper.journal,
                year: paper.year,
                doi: paper.doi,
                formatted: formatCitation(paper, format)
              }))
            });
            results.push("Multiple matches found - please select one");
            papers.push(null); // Placeholder for multiple matches
          } else {
            // Single match - format and add to results
            results.push(formatCitation(paperData, format));
            papers.push(paperData);
          }
        } else {
          results.push("No results found");
          notFound.push({ index: i, query: ref });
          papers.push(null);
        }
      } catch (error) {
        logger.error(`Error processing reference "${ref}":`, error);
        results.push("No results found");
        notFound.push({ index: i, query: ref });
        papers.push(null);
      }
    }
    
    res.json({
      formatted: results,
      notFound: notFound,
      multipleMatches: multipleMatches,
      papers: papers,
      format: format
    });
    
  } catch (error) {
    logger.error('Format endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Download endpoint
router.post('/download', [
  body('references').isString().notEmpty().withMessage('References are required'),
  body('format').isIn(['bibtex', 'endnote', 'apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee', 'ama', 'asa']).withMessage('Invalid format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { references, format } = req.body;
    
    // Split references by lines
    const lines = references.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return res.status(400).json({
        error: 'No valid references provided'
      });
    }

    const papers = [];
    
    // Process references with optimized lookup
    for (const ref of lines) {
      try {
        const paperData = await lookupPaper(ref);
        papers.push(paperData);
      } catch (error) {
        logger.error(`Error processing reference "${ref}":`, error);
        papers.push(null);
      }
    }
    
    let content = "";
    let filename = "references";
    let contentType = "text/plain";
    
    switch (format) {
      case 'bibtex':
        content = papers.map((paper, index) => formatBibTeX(paper, index)).join("\n\n");
        filename = "references.bib";
        contentType = "application/x-bibtex";
        break;
      case 'endnote':
        content = papers.map((paper, index) => formatEndNote(paper, index)).join("\n\n");
        filename = "references.enw";
        contentType = "application/x-endnote-refer";
        break;
      default:
        content = papers.map((paper, index) => formatCitation(paper, format)).join("\n\n");
        filename = `references_${format}.txt`;
        break;
    }
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
    
  } catch (error) {
    logger.error('Download endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Endpoint to handle user selection from multiple matches
router.post('/select-match', [
  body('referenceIndex').isInt({ min: 0 }).withMessage('Valid reference index required'),
  body('selectedOptionIndex').isInt({ min: 0 }).withMessage('Valid option index required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { referenceIndex, selectedOptionIndex } = req.body;
    
    // This endpoint will be used by the frontend to update the formatted result
    // when user selects from multiple matches
    res.json({
      success: true,
      message: 'Selection recorded'
    });
    
  } catch (error) {
    logger.error('Select match endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
