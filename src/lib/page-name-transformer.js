import url from 'url';

export default (address) => {
  const { host, pathname } = url.parse(address);
  const trimmedAddress = pathname === '/' ? host : `${host}${pathname}`;
  return `${trimmedAddress.replace(/[^A-Za-z]+/g, '-')}`;
};
