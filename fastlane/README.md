fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build a Release archive and ship it to TestFlight

### ios upload_archive

```sh
[bundle exec] fastlane ios upload_archive
```

Export and upload an already-built archive, without rebuilding (fastlane ios upload_archive archive_path:...).

----


## Mac

### mac beta

```sh
[bundle exec] fastlane mac beta
```

Build a Release Mac Catalyst archive and ship it to TestFlight

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
