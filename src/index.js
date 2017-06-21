import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import axios from './lib/axios';
import getPageName from './lib/page-name-transformer';
import substituteLinks from './lib/src-links-substitutor';
import downloadResources from './lib/resources-downloader';

export default (address, dir) => {
  const urlBasePath = url.parse(address).path;
  const pageName = getPageName(address);
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
    }).catch(error => console.log(`ERR: ${error}`));
};
