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
      task: ctx => func(link, options)
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

const downloadFiles = (html, address, isListring) => {
  const downloadLinks = getDownloadLinks(html, address);
  const options = { responseType: 'arraybuffer' };
  const taskType = 'resource';
  const downloadPromises = downloadLinks.map((link) => {
    if (isListring) {
      return runListrTask(link, axios.get, options, taskType);
    }
    return axios.get(link, options);
  });
  return Promise.all([...downloadPromises]);
};

const saveResources = (html, address, resourcesPath, isListring) =>
  downloadFiles(html, address, isListring).then((responses) => {
    const writePromises = responses.map((response) => {
      const fileName = renameResource(response.config.url, address);
      const fileData = response.data;
      fs.writeFile(path.resolve(resourcesPath, fileName), fileData);
      return null;
    });
    return Promise.all(writePromises);
  });

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
      const promiseResDir = fs.mkdir(resourcesPath);
      const promiseResources = saveResources(response.data, address, resourcesPath, isListring);
      return Promise.all([promiseResDir, promiseResources])
        .then(() => {
          const promisePage = isListring ?
            runListrTask(pagePath, fs.writeFile, substititedLinks, taskType) :
            fs.writeFile(pagePath, substititedLinks);
          return Promise.all([promisePage]);
        });
    });
};
