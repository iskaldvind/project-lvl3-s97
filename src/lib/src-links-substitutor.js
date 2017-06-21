import cheerio from 'cheerio';
import path from 'path';
import url from 'url';
import getWantedTags from './src-tags-provider';
import transformResuorceName from './resource-name-transformer';

export default (html, dir, urlBasePath) => {
  const $ = cheerio.load(html);
  getWantedTags().forEach((wantedTag) => {
    const foundWantedTags = $('html').find(wantedTag.name);
    foundWantedTags.toArray().forEach((srcTag) => {
      if ($(srcTag).attr(wantedTag.src)) {
        const localSrcLink = `./${path.join(dir, transformResuorceName(url.parse($(srcTag).attr(wantedTag.src)).path, urlBasePath))}`;
        $(srcTag).attr(wantedTag.src, localSrcLink);
      }
    });
  });
  return $.html();
};
