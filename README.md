React Native Toolbox
=====================

> A set of scripts to simplify React Native development

[![License](https://img.shields.io/npm/l/@forward-software/react-native-toolbox.svg)](https://github.com/forwardsoftware/react-native-toolbox/blob/main/LICENSE) [![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

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

<!-- commands -->
* [`rn-toolbox dotenv ENVIRONMENTNAME`](#rn-toolbox-dotenv-environmentname)
* [`rn-toolbox icons [FILE]`](#rn-toolbox-icons-file)
* [`rn-toolbox splash [FILE]`](#rn-toolbox-splash-file)
* [`rn-toolbox help [COMMAND]`](#rn-toolbox-help-command)

## `rn-toolbox dotenv ENVIRONMENTNAME`

Manage .env files for react-native-dotenv for a specific environment (development, production, etc...)

```
USAGE
  $ rn-toolbox dotenv ENVIRONMENTNAME [-h]

ARGUMENTS
  ENVIRONMENTNAME  name of the environment to load .dotenv file for.

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  Manage .env files for react-native-dotenv for a specific environment (development, production, etc...)

EXAMPLES
  $ rn-toolbox dotenv
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
  -h, --help             Show CLI help.
  -v, --verbose          Print more detailed log messages.

DESCRIPTION
  Generate app icons using a file as template.

  The template icon file should be at least 1024x1024px.


EXAMPLES
  $ rn-toolbox icons
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
  -h, --help             Show CLI help.
  -v, --verbose          Print more detailed log messages.

DESCRIPTION
  Generate app splashscreens using a file as template.

  The template splashscreen file should be at least 1242x2208px.


EXAMPLES
  $ rn-toolbox splash
```

_See code: [src/commands/splash.ts](https://github.com/forwardsoftware/react-native-toolbox/blob/main/src/commands/splash.ts)_

## `rn-toolbox help [COMMAND]`

Display help for rn-toolbox.

```
USAGE
  $ rn-toolbox help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for rn-toolbox.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.27/src/commands/help.ts)_
<!-- commandsstop -->

## License

Mozilla Public License 2.0

---

Made with ✨ & ❤️ by [ForWarD Software](https://github.com/forwardsoftware) and [contributors](https://github.com/forwardsoftware/react-native-toolbox/graphs/contributors)

If you found this project to be helpful, please consider contacting us to develop your React and React Native projects.
