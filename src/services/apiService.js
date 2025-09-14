const axios = require('axios');
const { logger } = require('../utils/logger');
const { trackAPICall } = require('../middleware/performance');

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API configuration
const API_CONFIG = {
  crossref: {
    baseURL: 'https://api.crossref.org/works',
    timeout: 10000,
    headers: {
      'User-Agent': 'CitationFormatter/1.0 (mailto:your-email@example.com)'
    }
  },
  semanticScholar: {
    baseURL: 'https://api.semanticscholar.org/graph/v1/paper/search',
    timeout: 10000,
    headers: {
      'User-Agent': 'CitationFormatter/1.0'
    }
  }
};

// Create axios instances with default configs
const crossrefClient = axios.create(API_CONFIG.crossref);
const semanticScholarClient = axios.create(API_CONFIG.semanticScholar);

/**
 * Search CrossRef by DOI
 */
async function searchCrossRefByDOI(doi) {
  try {
    logger.info(`Searching CrossRef for DOI: ${doi}`);
    const startTime = Date.now();
    
    const response = await crossrefClient.get(doi);
    trackAPICall('crossref', startTime, true);
    
    if (response.data && response.data.message) {
      const work = response.data.message;
      return {
        title: work.title?.[0] || "Unknown title",
        authors: work.author?.map(author => ({
          family: author.family || author.lastName,
          given: author.given || author.firstName
        })) || [],
        journal: work['container-title']?.[0] || work['event']?.[0]?.name || "Unknown journal",
        year: work.published?.['date-parts']?.[0]?.[0] || "Unknown year",
        doi: work.DOI || doi
      };
    }
    return null;
  } catch (error) {
    const startTime = Date.now();
    trackAPICall('crossref', startTime, false);
    logger.error('CrossRef DOI search error:', error.message);
    return null;
  }
}

/**
 * Search CrossRef by title
 */
async function searchCrossRefByTitle(title) {
  try {
    logger.info(`Searching CrossRef for title: "${title}"`);
    const startTime = Date.now();
    
    const response = await crossrefClient.get('', {
      params: {
        query: title,
        rows: 10,
        select: 'DOI,title,author,container-title,published,event'
      }
    });
    
    trackAPICall('crossref', startTime, true);
    
    if (response.data && response.data.message && response.data.message.items) {
      const items = response.data.message.items;
      const normalizedQuery = title.toLowerCase().trim();
      
      // Find exact or partial matches
      logger.info(`Found ${items.length} items from CrossRef`);
      const matches = items.filter(item => {
        const paperTitle = item.title?.[0] || "";
        const normalizedPaperTitle = paperTitle.toLowerCase().trim();
        return normalizedPaperTitle.includes(normalizedQuery);
      });
      logger.info(`Found ${matches.length} matches`);
      
      if (matches.length === 0) return null;
      if (matches.length === 1) {
        const work = matches[0];
        return {
          title: work.title?.[0] || "Unknown title",
          authors: work.author?.map(author => ({
            family: author.family || author.lastName,
            given: author.given || author.firstName
          })) || [],
          journal: work['container-title']?.[0] || work['event']?.[0]?.name || "Unknown journal",
          year: work.published?.['date-parts']?.[0]?.[0] || "Unknown year",
          doi: work.DOI || ""
        };
      }
      
      // Return multiple matches
      return matches.map(work => ({
        title: work.title?.[0] || "Unknown title",
        authors: work.author?.map(author => ({
          family: author.family || author.lastName,
          given: author.given || author.firstName
        })) || [],
        journal: work['container-title']?.[0] || work['event']?.[0]?.name || "Unknown journal",
        year: work.published?.['date-parts']?.[0]?.[0] || "Unknown year",
        doi: work.DOI || ""
      }));
    }
    return null;
  } catch (error) {
    const startTime = Date.now();
    trackAPICall('crossref', startTime, false);
    logger.error('CrossRef title search error:', error.message);
    return null;
  }
}

/**
 * Search Semantic Scholar by title
 */
async function searchSemanticScholarByTitle(title) {
  try {
    logger.info(`Searching Semantic Scholar for title: "${title}"`);
    const startTime = Date.now();
    
    const response = await semanticScholarClient.get('', {
      params: {
        query: title,
        limit: 10,
        fields: 'title,authors,venue,year'
      }
    });
    
    trackAPICall('semanticScholar', startTime, true);
    
    if (response.data && response.data.data) {
      const papers = response.data.data;
      const normalizedQuery = title.toLowerCase().trim();
      
      // Find exact or partial matches
      logger.info(`Found ${papers.length} papers from Semantic Scholar`);
      const matches = papers.filter(paper => {
        const paperTitle = paper.title || "";
        const normalizedPaperTitle = paperTitle.toLowerCase().trim();
        return normalizedPaperTitle.includes(normalizedQuery);
      });
      logger.info(`Found ${matches.length} matches`);
      
      if (matches.length === 0) return null;
      if (matches.length === 1) {
        const paper = matches[0];
        return {
          title: paper.title || "Unknown title",
          authors: paper.authors?.map(author => ({
            family: author.name?.split(' ').pop() || author.lastName,
            given: author.name?.split(' ').slice(0, -1).join(' ') || author.firstName
          })) || [],
          journal: paper.venue || "Unknown journal",
          year: paper.year || "Unknown year",
          doi: paper.doi || ""
        };
      }
      
      // Return multiple matches
      return matches.map(paper => ({
        title: paper.title || "Unknown title",
        authors: paper.authors?.map(author => ({
          family: author.name?.split(' ').pop() || author.lastName,
          given: author.name?.split(' ').slice(0, -1).join(' ') || author.firstName
        })) || [],
        journal: paper.venue || "Unknown journal",
        year: paper.year || "Unknown year",
        doi: paper.doi || ""
      }));
    }
    return null;
  } catch (error) {
    const startTime = Date.now();
    trackAPICall('semanticScholar', startTime, false);
    
    if (error.response && error.response.status === 429) {
      logger.error('Semantic Scholar rate limit exceeded. Please wait before making more requests.');
    } else {
      logger.error('Semantic Scholar search error:', error.message);
    }
    return null;
  }
}

module.exports = {
  searchCrossRefByDOI,
  searchCrossRefByTitle,
  searchSemanticScholarByTitle
};
