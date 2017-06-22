import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import axios from './lib/axios';
import { renameResource, renamePage } from './helpers/name-transformers';

const getDownloadingResourcesTags = () => [
  { name: 'link', src: 'href' },
  { name: 'script', src: 'src' },
  { name: 'img', src: 'src' },
];

const getDownloadLinks = (html, host) => {
  const $ = cheerio.load(html);
  return getDownloadingResourcesTags().reduce((acc, wantedTag) => {
    const foundWantedTags = $('html').find(wantedTag.name);
    return [...acc, ...(foundWantedTags
      .filter(tag => $(foundWantedTags[tag]).attr(wantedTag.src))
      .toArray()
      .map((tag) => {
        const link = tag.attribs[wantedTag.src];
        const uri = url.parse(link);
        uri.hostname = uri.hostname || url.parse(host).hostname;
        uri.protocol = uri.protocol || url.parse(host).protocol;
        return url.format(uri);
      }))];
  }, []);
};

const getResources = (html, address) => {
  const downloadLinks = getDownloadLinks(html, address);
  const promises = downloadLinks.map(link => axios.get(link, { responseType: 'arraybuffer' }));
  return Promise.all(promises)
    .then((resources) => {
      const resPromises = resources.map(resource => ({
        dlPath: renameResource(resource.config.url, address),
        data: resource.data,
      }));
      return Promise.all(resPromises);
    });
};

const downloadResources = (html, address, resourcesPath) => {
  getResources(html, address)
    .then((resources) => {
      const promises = resources.map(resource =>
        fs.writeFile(path.resolve(resourcesPath, resource.dlPath), resource.data));
      return Promise.all(promises);
    })
    .catch(error => error);
};

const substituteLinks = (html, dir, urlBasePath) => {
  const $ = cheerio.load(html);
  getDownloadingResourcesTags().forEach((wantedTag) => {
    const foundWantedTags = $('html').find(wantedTag.name);
    foundWantedTags.toArray().forEach((srcTag) => {
      if ($(srcTag).attr(wantedTag.src)) {
        const resourceSrcLink = $(srcTag).attr(wantedTag.src);
        const resourcePath = url.parse(resourceSrcLink).path;
        const newResourceName = renameResource(resourcePath, urlBasePath);
        const localSrcLink = `./${path.join(dir, newResourceName)}`;
        $(srcTag).attr(wantedTag.src, localSrcLink);
      }
    });
  });
  return $.html();
};

export default (address, dir) => {
  const urlBasePath = url.parse(address).path;
  const pageName = renamePage(address);
  const pagePath = path.resolve(dir, `${pageName}.html`);
  const resourcesDir = `./${pageName}_files`;
  const resourcesPath = path.resolve(dir, `${pageName}_files`);
  return fs.mkdir(resourcesPath)
    .then(() => axios.get(address))
    .then((response) => {
      const promisePage = fs
        .writeFile(pagePath, substituteLinks(response.data, resourcesDir, urlBasePath));
      const promiseResources = downloadResources(response.data, address, resourcesPath);
      return Promise.all([promisePage, promiseResources]);
    }).catch(error => error);
};
