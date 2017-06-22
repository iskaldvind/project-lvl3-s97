import url from 'url';
import dbg from 'debug';

const debug = dbg('page-loader');

export const renamePage = (address) => {
  debug('hi!');
  const { host, pathname } = url.parse(address);
  const trimmedAddress = pathname === '/' ? host : `${host}${pathname}`;
  return `${trimmedAddress.replace(/[^A-Za-z]+/g, '-')}`;
};

export const renameResource = (resourcePath, urlBasePath) => {
  const urlBasePathRegexString = `^${urlBasePath}\\/*`;
  const regex = new RegExp(urlBasePathRegexString);
  return resourcePath.replace(regex, '').replace(/\//g, '-');
};