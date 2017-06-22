import url from 'url';

export const renamePage = (address) => {
  const { host, pathname } = url.parse(address);
  const trimmedAddress = pathname === '/' ? host : `${host}${pathname}`;
  return `${trimmedAddress.replace(/[^A-Za-z]+/g, '-')}`;
};

export const renameResource = (resourcePath, urlBasePath) => {
  const urlBasePathRegexString = `^${urlBasePath}\\/*`;
  const regex = new RegExp(urlBasePathRegexString);
  return resourcePath.replace(regex, '').replace(/\//g, '-');
};
