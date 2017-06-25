import program from 'commander';
import download from '.';
import formatError from './helpers/error-message-formatter';

const isListring = true;

export default () => {
  program
    .version('0.3.2')
    .arguments('<url>')
    .description('Downloads page into local directory (current by default)')
    .option('-o, --output <path>', 'output directory path', './')
    .action((url, options) => {
      download(url, options.output, isListring)
        .then(() => {
          process.exit();
        })
        .catch((error) => {
          console.error(formatError(error));
          process.exit(1);
        });
    })
    .parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
};
