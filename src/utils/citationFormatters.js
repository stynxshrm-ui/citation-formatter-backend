// Shared citation formatting utilities

// Conference keywords for venue detection
const CONFERENCE_KEYWORDS = [
  'proceedings', 'conference', 'cvpr', 'iccv', 'eccv', 
  'nips', 'icml', 'aaai', 'ijcai', 'acl', 'emnlp'
];

// Author formatting by style
const AUTHOR_FORMATTERS = {
  mla: (author) => {
    const family = author.family || author.lastName || "Unknown";
    const given = author.given || author.firstName || "";
    return given ? `${family}, ${given}` : family;
  },
  vancouver: (author) => {
    const family = author.family || author.lastName || "Unknown";
    const given = author.given || author.firstName || "";
    return given ? `${family} ${given.charAt(0)}` : family;
  },
  default: (author) => {
    const family = author.family || author.lastName || "Unknown";
    const given = author.given || author.firstName || "";
    return given ? `${family}, ${given.charAt(0)}.` : family;
  }
};

// Author list separators by style
const AUTHOR_SEPARATORS = {
  mla: (authors) => authors.slice(0, -1).join(', ') + ', and ' + authors[authors.length - 1],
  vancouver: (authors) => authors.join(', '),
  default: (authors) => authors.slice(0, -1).join(', ') + ' & ' + authors[authors.length - 1]
};

// Citation templates by style
const CITATION_TEMPLATES = {
  mla: (authors, title, venue, year) => `${authors}. "${title}." ${venue}, ${year}.`,
  chicago: (authors, title, venue, year) => `${authors}. "${title}." ${venue} ${year}.`,
  harvard: (authors, title, venue, year) => `${authors} (${year}) '${title}', ${venue}.`,
  vancouver: (authors, title, venue, year) => `${authors}. ${title}. ${venue}. ${year}.`,
  ieee: (authors, title, venue, year) => `${authors}, "${title}," ${venue}, ${year}.`,
  ama: (authors, title, venue, year) => `${authors}. ${title}. ${venue}. ${year}.`,
  asa: (authors, title, venue, year) => `${authors}. ${year}. "${title}." ${venue}.`,
  apa: (authors, title, venue, year) => `${authors} (${year}). ${title}. ${venue}.`
};

/**
 * Format authors according to citation style
 */
function formatAuthors(authors, style = 'apa') {
  if (!authors || authors.length === 0) return "Unknown author";
  
  const formatter = AUTHOR_FORMATTERS[style] || AUTHOR_FORMATTERS.default;
  const authorList = authors.map(formatter);
  
  if (authorList.length === 1) return authorList[0];
  
  const separator = AUTHOR_SEPARATORS[style] || AUTHOR_SEPARATORS.default;
  return separator(authorList);
}

/**
 * Format venue for conference proceedings
 */
function formatVenue(journal, year) {
  if (!journal) return "Unknown journal";
  
  const isConference = CONFERENCE_KEYWORDS.some(keyword => 
    journal.toLowerCase().includes(keyword)
  );
  
  if (!isConference) return journal;
  
  // Clean up conference names - remove year if it's already in the title
  let cleanJournal = journal;
  if (cleanJournal.includes(year.toString())) {
    cleanJournal = cleanJournal.replace(year.toString(), '').replace(/\s*,\s*/, '').trim();
  }
  return `Proceedings of the ${cleanJournal}`;
}

/**
 * Format citation in specified style
 */
function formatCitation(paper, style = 'apa') {
  if (!paper) return "No results found";
  
  const title = paper.title || "Unknown title";
  const year = paper.year || "Unknown year";
  const journal = paper.journal || paper.venue || "Unknown journal";
  
  const authors = formatAuthors(paper.authors, style);
  const venue = formatVenue(journal, year);
  
  const template = CITATION_TEMPLATES[style] || CITATION_TEMPLATES.apa;
  return template(authors, title, venue, year);
}

/**
 * Format BibTeX entry
 */
function formatBibTeX(paper, index) {
  if (!paper) return "";
  
  const title = paper.title || "Unknown title";
  const year = paper.year || "Unknown year";
  const journal = paper.journal || paper.venue || "Unknown journal";
  const doi = paper.doi || "";
  
  let authors = "Unknown author";
  if (paper.authors && paper.authors.length > 0) {
    authors = paper.authors.map(author => {
      const family = author.family || author.lastName || "Unknown";
      const given = author.given || author.firstName || "";
      return given ? `${family}, ${given}` : family;
    }).join(' and ');
  }
  
  return `@article{ref${index + 1},
  title={${title}},
  author={${authors}},
  journal={${journal}},
  year={${year}},
  doi={${doi}}
}`;
}

/**
 * Format EndNote entry
 */
function formatEndNote(paper, index) {
  if (!paper) return "";
  
  const title = paper.title || "Unknown title";
  const year = paper.year || "Unknown year";
  const journal = paper.journal || paper.venue || "Unknown journal";
  const doi = paper.doi || "";
  
  let authors = "Unknown author";
  if (paper.authors && paper.authors.length > 0) {
    authors = paper.authors.map(author => {
      const family = author.family || author.lastName || "Unknown";
      const given = author.given || author.firstName || "";
      return given ? `${given} ${family}` : family;
    }).join('\r\n');
  }
  
  return `%0 Journal Article
%T ${title}
%A ${authors}
%J ${journal}
%D ${year}
%R ${doi}
%U https://doi.org/${doi}`;
}

module.exports = {
  formatCitation,
  formatBibTeX,
  formatEndNote,
  formatAuthors,
  formatVenue
};
