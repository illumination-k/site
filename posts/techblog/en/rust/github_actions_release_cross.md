---
uuid: 8359beab-daec-4977-a8cf-d2064cbed808
title: Cross-Compiling and Uploading Binaries on Release with GitHub Actions and cross
description: Cross-compiling and uploading binaries on Release with GitHub Actions and cross
lang: en
category: techblog
tags:
  - rust
  - github-actions
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

A common use case for Rust is creating command-line tools. One of the advantages of using Rust for CLI tools is that you can distribute a single binary, making it easy to use.

Since the source code will be managed on GitHub anyway, it's convenient to automatically distribute the latest binaries with each release. And it's even more convenient to automatically cross-compile for multiple platforms, so I'll explain how to do that.

## Cross Build

We'll use [cross](https://github.com/rust-embedded/cross), a package that performs cross builds using Docker. By using [actions-rs/cargo](https://github.com/actions-rs/cargo) for Rust GitHub Actions, you can easily perform cross builds in GitHub Actions.

The usage is very simple -- just set `use-cross` to `true` in the `with` section when using `actions-rs/cargo@v1`.

```yaml
- uses: actions-rs/cargo@v1
  with:
    use-cross: true
    command: build
    args: --target armv7-unknown-linux-gnueabihf
```

## Release and Upload

While there are actions for creating releases and uploading, they tend to get quite long with uploading binaries as artifacts and such, so we'll use [Upload files to a GitHub release](https://github.com/marketplace/actions/upload-files-to-a-github-release). The official sample looks like this, making it very easy to create a release and upload binaries.

```yml title=simple_example.yml
name: Publish

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Publish binaries
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: Build
      run: cargo build --release
    - name: Upload binaries to release
      uses: svenstaro/upload-release-action@v2
      with:
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        file: target/release/mything
        asset_name: mything
        tag: ${{ github.ref }}
        overwrite: true
        body: "This is my release text"
```

## Release.yml

The final YAML combining cross build with release and upload is shown below. We use a matrix to build for multiple platforms. We specify both musl and gnu because there's a critical issue where binaries won't run on older CentOS without musl. Normally, you'd also want to include Windows and similar targets.

When including Windows, you can build normally on Ubuntu. The only thing to watch out for is that the output file needs a `.exe` extension.

```yml title=Release.yml
name: Release

on:
  push:
    tags:
      - '*'

jobs:
  build:
    name: Release binary
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            artifact_name: example
            asset_name: example-x86_64-unknown-linux-gnu
          - os: ubuntu-latest
            target: x86_64-unknown-linux-musl
            artifact_name: example
            asset_name: example-x86_64-unknown-linux-musl
          - os: ubuntu-latest
            target: x86_64-pc-windows-gnu
            artifact_name: example.exe
            asset_name: example-x86_64-pc-windows-gnu.exe
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact_name: example
            asset_name: example-x86_64-apple-darwin


    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Install stable toolchain
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true

      - name: Cross build with all features
        uses: actions-rs/cargo@v1
        with:
          use-cross: true
          command: build
          args: --release --target ${{ matrix.target }} --all-features --verbose

      - name: Upload binaries to release
        uses: svenstaro/upload-release-action@2.1.1
        with:
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          file: target/${{ matrix.target }}/release/${{ matrix.artifact_name }}
          asset_name: ${{ matrix.asset_name }}
          tag: ${{ github.ref }}
          overwrite: true
```
