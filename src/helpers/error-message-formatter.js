import path from 'path';
import httpMessage from 'http-status-codes';

const formatError = (code, message, errPath) => `${code}: ${message} => ${errPath}`;

export default (error) => {
  if (error.response) {
    const code = error.response.status;
    return `${code}: ${httpMessage.getStatusText(code).toUpperCase()} => ${error.response.config.url}`;
  }
  switch (error.code) {
    case 'ENOENT': {
      const nonexistedPath = path.dirname(error.path);
      return formatError(error.code, 'OUTPUT DIRECTORY DOES NOT EXIST', nonexistedPath);
    }
    case 'EEXIST': {
      return formatError(error.code, 'DIRECTORY ALREADY EXISTS', error.path);
    }
    case 'EACCESS': {
      return formatError(error.code, 'NOT AUTHORIZED TO WRITE IN DIRECTORY', error.path);
    }
    case 'ENOTFOUND': {
      return formatError(error.code, 'UNABLE TO RESOLVE ADDRESS', error.config.url);
    }
    default: {
      return `UNKNOWN ERROR ${error.message}`;
    }
  }
};
