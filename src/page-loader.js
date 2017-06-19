import fs from 'mz/fs';
import axios from './lib/axios';
import resolvePath from './lib/helpers';

/*
export default (address, dir) => axios.get(address)
  .then((response) => {
    fs.writeFile(resolvePath(address, dir), response.data).catch(error => error);
  });
*/

export default (address, dir) => {
  return axios.get(address)
    .then(response => fs.writeFile(resolvePath(address, dir), response.data))
    .catch(err => err);
};
