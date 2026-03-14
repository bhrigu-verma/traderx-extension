export const SELECTORS = {
  POST_CONTAINER: [
    'div[data-id^="urn:li:activity"]',
    'div.feed-shared-update-v2',
    'div[data-urn]',
    'div.feed-shared-update-v2__description-wrapper'
  ],
  POST_AUTHOR_NAME: [
    '.update-components-actor__name',
    '.feed-shared-actor__name',
    'span[dir="ltr"] > span[aria-hidden="true"]'
  ],
  POST_AUTHOR_HEADLINE: [
    '.update-components-actor__description',
    '.feed-shared-actor__description'
  ],
  POST_AUTHOR_LINK: [
    '.update-components-actor__container a',
    '.feed-shared-actor__container-link'
  ],
  POST_CONTENT_TEXT: [
    '.feed-shared-update-v2__description',
    '.update-components-text',
    '.feed-shared-text__text-view'
  ],
  POST_TIMESTAMP: [
    '.feed-shared-actor__sub-description .visually-hidden',
    'time.update-components-actor__sub-description',
    'span.update-components-actor__sub-description',
    'time'
  ],
  POST_ENGAGEMENT: [
    '.social-details-social-counts',
    '.feed-shared-social-action-bar'
  ],
  SECONDARY_INDICATOR: [
    '.feed-shared-actor__description',
    '.update-components-actor__supplementary-actor-info'
  ],
  SPONSORED_LABEL: [
    '.feed-shared-actor__supplementary-actor-info',
    '.ad-banner-container',
    '[data-ad-preview]'
  ],
  POLL_INDICATOR: [
    '.feed-shared-poll',
    '[data-test-poll-option]'
  ],
  VIDEO_INDICATOR: [
    '.feed-shared-video',
    'video',
    '.video-player'
  ],
  CAROUSEL_INDICATOR: [
    '.feed-shared-carousel',
    '.document-carousel-item',
    '[data-test-document-carousel]'
  ],
  REPOST_INDICATOR: [
    '.feed-shared-update-v2__reshared-update',
    '.update-components-reshared-update',
    '.feed-shared-reshared-update'
  ],
  FEED_CONTAINER: [
    '.scaffold-finite-scroll__content',
    '.feed-shared-update-v2__content',
    'main.scaffold-layout__main'
  ],
  SEARCH_RESULTS_CONTAINER: [
    '.search-results-container',
    '.search-results__list',
    '.reusable-search__entity-result-list'
  ],
  SEARCH_RESULT_ITEM: [
    '.reusable-search__result-container',
    'li.search-result',
    'li.reusable-search__result-container'
  ],
  JOB_CARD: [
    '.job-card-container',
    '.jobs-search-results__list-item'
  ]
};

export function findElement(parent, selectorKey) {
  const selectors = SELECTORS[selectorKey];
  if (!selectors) return null;

  for (const selector of selectors) {
    try {
      const el = parent.querySelector(selector);
      if (el) return el;
    } catch (error) {
      // ignore invalid selectors
    }
  }

  return null;
}

export function findElements(parent, selectorKey) {
  const selectors = SELECTORS[selectorKey];
  if (!selectors) return [];

  for (const selector of selectors) {
    try {
      const elements = parent.querySelectorAll(selector);
      if (elements.length > 0) return Array.from(elements);
    } catch (error) {
      // ignore invalid selectors
    }
  }

  return [];
}
