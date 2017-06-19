import url from 'url';
import path from 'path';

const makeNameFromAddress = (address) => {
  const { host, pathname } = url.parse(address);
  const trimmedAddress = pathname === '/' ? host : `${host}${pathname}`;
  const name = trimmedAddress.replace(/[^A-Za-z]+/g, '-');
  return `${name}.html`;
};

const downloadPage = (address, dir) => `${makeNameFromAddress(address)} - ${path.resolve(dir)}`;

export default downloadPage;
