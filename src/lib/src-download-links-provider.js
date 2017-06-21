import url from 'url';
import cheerio from 'cheerio';
import getWantedTags from './src-tags-provider';

export default (html, host) => {
  const $ = cheerio.load(html);
  return getWantedTags().reduce((acc, wantedTag) => {
    const foundWantedTags = $('html').find(wantedTag.name);
    foundWantedTags
      .filter(tag => $(foundWantedTags[tag]).attr(wantedTag.src))
      .toArray()
      .forEach((tag) => {
        const link = tag.attribs[wantedTag.src];
        const uri = url.parse(link);
        uri.hostname = uri.hostname || url.parse(host).hostname;
        uri.protocol = uri.protocol || url.parse(host).protocol;
        acc.push(url.format(uri));
      });
    return acc;
  }, []);
};
