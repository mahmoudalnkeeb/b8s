export interface ExtractedMetadata {
  urls: string[];
  emails: string[];
  phones: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export function extractMetadata(text: string): ExtractedMetadata {
  const metadata: ExtractedMetadata = {
    urls: [],
    emails: [],
    phones: [],
    socialLinks: {},
  };

  // Extract URLs (with or without protocol) - exclude common false positives like Node.js
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(?:com|org|net|io|dev|ai|app|tech|co|me|info|biz|us|uk|ca|de|fr|jp|cn|ru|br|in|au|nl|se|no|dk|fi|pl|ch|at|be|pt|es|it|gr|cz|ro|hu|bg|hr|sk|si|lt|lv|ee|lu|mt|cy)[a-zA-Z0-9()]*?(?:\/[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?/gi;
  const urls = text.match(urlRegex);
  if (urls) {
    // Filter out common false positives
    const filteredUrls = urls.filter(u => {
      const lower = u.toLowerCase();
      return !['node.js', 'express.js', 'socket.io', 'react.js', 'vue.js', 'angular.js'].some(fp => lower === fp);
    });
    metadata.urls = [...new Set(filteredUrls.map(u => u.replace(/[.,;:]$/, '')))];
  }

  // Extract emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
  const emails = text.match(emailRegex);
  if (emails) {
    metadata.emails = [...new Set(emails.map(e => e.replace(/[.,;:]$/, '')))];
  }

  // Extract phone numbers (various formats) - must start with + or ( for international
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?\d{4,}|\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    metadata.phones = [...new Set(phones.map(p => p.trim()))];
  }

  // Extract GitHub profile
  const githubRegex = /github\.com\/([\w-]+)/gi;
  const githubMatch = githubRegex.exec(text);
  if (githubMatch) {
    metadata.socialLinks.github = `github.com/${githubMatch[1]}`;
  }

  // Extract LinkedIn profile
  const linkedinRegex = /linkedin\.com\/in\/([\w-]+)/gi;
  const linkedinMatch = linkedinRegex.exec(text);
  if (linkedinMatch) {
    metadata.socialLinks.linkedin = `linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Extract Twitter/X profile
  const twitterRegex = /(?:twitter\.com|x\.com)\/([\w-]+)/gi;
  const twitterMatch = twitterRegex.exec(text);
  if (twitterMatch) {
    metadata.socialLinks.twitter = `twitter.com/${twitterMatch[1]}`;
  }

  return metadata;
}

export function hasMetadata(text: string): boolean {
  const metadata = extractMetadata(text);
  return (
    metadata.urls.length > 0 ||
    metadata.emails.length > 0 ||
    metadata.phones.length > 0 ||
    Object.keys(metadata.socialLinks).length > 0
  );
}
