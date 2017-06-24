import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import dbg from 'debug';
import Listr from 'listr';
import axios from './lib/axios';
import { renameResource, renamePage } from './helpers/name-transformers';

const debug = dbg('page-loader');

const getDownloadingResourcesTags = () => [
  { name: 'link', src: 'href' },
  { name: 'script', src: 'src' },
  { name: 'img', src: 'src' },
];

const listrTitles = (taskType, link) => {
  switch (taskType) {
    case 'page': return `Page was downloaded as '${path.basename(link)}'\n`;
    default: return link;
  }
};

const runListrTask = (link, func, options, taskType) => {
  const tasks = new Listr([
    {
      title: listrTitles(taskType, link),
      task: (ctx) => func(link, options)
        .then((data) => {
          ctx.result = data;
        }),
    },
  ]);
  return tasks.run()
    .then(ctx => ctx.result);
};

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

const getResources = (html, address, isListring) => {
  const downloadLinks = getDownloadLinks(html, address);
  const promises = downloadLinks.map((link) => {
    const options = { responseType: 'arraybuffer' };
    if (isListring) {
      const taskType = 'resource';
      return runListrTask(link, axios.get, options, taskType);
    }
    return axios.get(link, { responseType: 'arraybuffer' });
  });
  return Promise.all(promises)
    .then((resources) => {
      const resPromises = resources.map(resource => ({
        name: renameResource(resource.config.url, address),
        data: resource.data,
      }));
      return Promise.all(resPromises);
    });
};

const downloadResources = (html, address, resourcesPath, isListring) => {
  getResources(html, address, isListring)
    .then((resources) => {
      const promises = resources.map((resource) => {
        debug(`Saving resource '${resource.name}' to '${resourcesPath}'`);
        return fs.writeFile(path.resolve(resourcesPath, resource.name), resource.data);
      });
      return Promise.all(promises);
    });
};

const substituteLinks = (html, dir, urlBasePath) => {
  const $ = cheerio.load(html);
  debug('Changing html links');
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

const saveResources = (html, address, resourcesPath, isListring) =>
  fs.mkdir(resourcesPath)
    .then(() => downloadResources(html, address, resourcesPath, isListring));

export default (address, dir, isListring = false) => {
  debug(`Starting download page from '${address}' to '${dir}'`);
  const urlBasePath = url.parse(address).path;
  const pageName = renamePage(address);
  const pagePath = path.resolve(dir, `${pageName}.html`);
  const resourcesDir = `./${pageName}_files`;
  const resourcesPath = path.resolve(dir, `${pageName}_files`);
  return axios.get(address)
    .then((response) => {
      debug('Loading page');
      const substititedLinks = substituteLinks(response.data, resourcesDir, urlBasePath);
      const taskType = 'page';
      const promisePage = isListring ?
        runListrTask(pagePath, fs.writeFile, substititedLinks, taskType) :
        fs.writeFile(pagePath, substititedLinks);
      const promiseResources = saveResources(response.data, address, resourcesPath, isListring);
      return Promise.all([promisePage, promiseResources]);
    });
};
