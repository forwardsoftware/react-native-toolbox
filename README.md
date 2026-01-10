React Native Toolbox
=====================

> A set of scripts to simplify React Native development

[![License](https://img.shields.io/npm/l/@forward-software/react-native-toolbox.svg)](https://github.com/forwardsoftware/react-native-toolbox/blob/main/LICENSE)
[![Version](https://img.shields.io/npm/v/@forward-software/react-native-toolbox.svg)](https://npmjs.org/package/@forward-software/react-native-toolbox) [![Downloads/week](https://img.shields.io/npm/dw/@forward-software/react-native-toolbox.svg)](https://npmjs.org/package/@forward-software/react-native-toolbox)

<!-- toc -->
* [Install](#install)
* [Commands](#commands)
<!-- tocstop -->

# Install

```bash
yarn add -D @forward-software/react-native-toolbox
```

or use it directly with

```bash
npx @forward-software/react-native-toolbox <command>
```

# Commands

* [`rn-toolbox dotenv ENVIRONMENTNAME`](#rn-toolbox-dotenv-environmentname)
* [`rn-toolbox icons [FILE]`](#rn-toolbox-icons-file)
* [`rn-toolbox splash [FILE]`](#rn-toolbox-splash-file)

## `rn-toolbox dotenv ENVIRONMENTNAME`

Manage .env files for react-native-dotenv for a specific environment (development, production, etc...)

```
USAGE
  $ rn-toolbox dotenv ENVIRONMENTNAME [-h] [-v]

ARGUMENTS
  ENVIRONMENTNAME  name of the environment to load .dotenv file for.

FLAGS
  -h, --help     Show help
  -v, --verbose  Print more detailed log messages

DESCRIPTION
  Manage .env files for react-native-dotenv for a specific environment (development, production, etc...)

EXAMPLES
  $ rn-toolbox dotenv production
  $ rn-toolbox dotenv development -v
```

_See code: [src/commands/dotenv.ts](https://github.com/forwardsoftware/react-native-toolbox/blob/main/src/commands/dotenv.ts)_

## `rn-toolbox icons [FILE]`

Generate app icons using a file as template.

```
USAGE
  $ rn-toolbox icons [FILE] [-a <value>] [-h] [-v]

ARGUMENTS
  FILE  [default: ./assets/icon.png] Input icon file

FLAGS
  -a, --appName=<value>  App name used to build output assets path. Default is retrieved from 'app.json' file.
  -h, --help             Show help
  -v, --verbose          Print more detailed log messages

DESCRIPTION
  Generate app icons using a file as template.

  The template icon file should be at least 1024x1024px.


EXAMPLES
  $ rn-toolbox icons
  $ rn-toolbox icons ./my-icon.png --appName MyApp
  $ rn-toolbox icons -v
```

_See code: [src/commands/icons.ts](https://github.com/forwardsoftware/react-native-toolbox/blob/main/src/commands/icons.ts)_

## `rn-toolbox splash [FILE]`

Generate app splashscreens using a file as template.

```
USAGE
  $ rn-toolbox splash [FILE] [-a <value>] [-h] [-v]

ARGUMENTS
  FILE  [default: ./assets/splashscreen.png] Input splashscreen file

FLAGS
  -a, --appName=<value>  App name used to build output assets path. Default is retrieved from 'app.json' file.
  -h, --help             Show help
  -v, --verbose          Print more detailed log messages

DESCRIPTION
  Generate app splashscreens using a file as template.

  The template splashscreen file should be at least 1242x2208px.


EXAMPLES
  $ rn-toolbox splash
  $ rn-toolbox splash ./my-splash.png --appName MyApp
  $ rn-toolbox splash -v
```

_See code: [src/commands/splash.ts](https://github.com/forwardsoftware/react-native-toolbox/blob/main/src/commands/splash.ts)_

## License

Mozilla Public License 2.0

---

Made with ✨ & ❤️ by [ForWarD Software](https://github.com/forwardsoftware) and [contributors](https://github.com/forwardsoftware/react-native-toolbox/graphs/contributors)

If you found this project to be helpful, please consider contacting us to develop your React and React Native projects.
