export default (resourcePath, urlBasePath) => {
  const urlBasePathRegexString = `^${urlBasePath}\\/`;
  const regex = new RegExp(urlBasePathRegexString);
  return resourcePath.replace(regex, '').replace(/\//, '-');
};
