#!/bin/sh

# Install CocoaPods and yarn using Homebrew.
brew install cocoapods
brew install node

# Install dependencies
npm install
pod install