import program from 'commander';
import download from '.';

export default () => {
  program
    .version('0.1.x')
    .arguments('<url>')
    .description('Downloads page into local directory (current by default)')
    .option('-o, --output <path>', 'output directory path', './')
    .action((url, options) => {
      download(url, options.output).catch(error => console.log(error));
    })
    .parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
};
