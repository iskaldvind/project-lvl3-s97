import axios from 'axios';
import fs from 'mz/fs';
import path from 'path';
import getDownloadLinks from './src-download-links-provider';
import transformResuorceName from './resource-name-transformer';

const getResources = (html, address) => {
  const downloadLinks = getDownloadLinks(html, address);
  const promises = downloadLinks.map(link => axios.get(link, { responseType: 'arraybuffer' }));
  return Promise.all(promises)
    .then(resources => resources.map(resource => ({
      dlPath: transformResuorceName(resource.config.url, address),
      data: resource.data,
    })))
    .catch(error => error);
};

export default (html, address, resourcesPath) => {
  getResources(html, address)
    .then((resources) => {
      const promises = resources.map(resource =>
        fs.writeFile(path.resolve(resourcesPath, resource.dlPath), resource.data));
      return Promise.all(promises);
    })
    .catch(error => error);
};
