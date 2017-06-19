import program from 'commander';
import downloadPage from './page-loader';

const main = () => {
  program
    .version('0.0.x')
    .arguments('<url>')
    .description('Downloads page into local directory (current by default)')
    .option('-o, --output <path>', 'output directory path', './')
    .action((url, options) => {
      console.log(downloadPage(url, options.output));
    })
    .parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
};

export default main;
