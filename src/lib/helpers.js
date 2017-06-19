import url from 'url';
import path from 'path';

export default (address, dir) => {
  const outputDirName = path.resolve(dir);
  const { host, pathname } = url.parse(address);
  const trimmedAddress = pathname === '/' ? host : `${host}${pathname}`;
  const outputFileName = `${trimmedAddress.replace(/[^A-Za-z]+/g, '-')}.html`;
  return path.join(outputDirName, outputFileName);
};
