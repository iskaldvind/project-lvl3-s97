# project-lvl2-s96

[![Code Climate](https://codeclimate.com/github/iskaldvind/project-lvl2-s96/badges/gpa.svg)](https://codeclimate.com/github/iskaldvind/project-lvl2-s96)
[![Test Coverage](https://codeclimate.com/github/iskaldvind/project-lvl2-s96/badges/coverage.svg)](https://codeclimate.com/github/iskaldvind/project-lvl2-s96/coverage)
[![Issue Count](https://codeclimate.com/github/iskaldvind/project-lvl2-s96/badges/issue_count.svg)](https://codeclimate.com/github/iskaldvind/project-lvl2-s96)
[![Build Status](https://travis-ci.org/iskaldvind/project-lvl2-s96.svg?branch=master)](https://travis-ci.org/iskaldvind/project-lvl2-s96) 

## Install:  
npm install -g gendiff-234389

## Usage:
```
gendiff [-f (tree|plain|json)] <firstConfig> <secondConfig>
```
Compares two configuration files and shows a difference  
Supported file types: **json**, **ini**, **yml**  
Supported output formats: **tree** (default), **plain**, **json**  

Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -f, --format [type]  output format
  
Examples:
  
    gendiff first-file.json another-file.json
    gendiff -f plain first-file.ini another-file.ini
    gendiff ---format json first-file.yml another-file.yml
