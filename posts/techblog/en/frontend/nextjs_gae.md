---
uuid: 59907b94-6fbc-4f69-ad82-09140f30edb1
title: Deploying Next.js to GAE with Cloud Build
description: A guide to deploying Next.js to Google App Engine via Cloud Build
lang: en
category: techblog
tags:
  - frontend
  - development
  - next.js
  - gae
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

A record of getting Next.js running on Google App Engine (GAE). I tried Cloudflare first but AMP pages threw errors, so I put that on hold.

The requirements were:

- Deploy on push/PR via GitHub integration
- Deploy via webhook using curl or similar

So the goal was to create a trigger in Cloud Build and deploy to GAE.

## Deploying to GAE

To get things running first, let's write the configuration files and deploy.
Since I'm just hosting a personal blog, I want to stay within the free tier as much as possible. I also set up budget alerts just in case ([How to Achieve Safe Cloud Operations with Google Cloud (GCP) Budget Alerts](https://www.topgate.co.jp/gcp-budget-alert#google-cloud-gcp-6)).

I referenced the following sites for configuration:

- [How to Run Google App Engine for Free (2018 Edition)](https://koni.hateblo.jp/entry/2016/01/06/130613)
- [Google App Engine Auto Scaling Settings to Stay Within the Free Tier](https://blog.longkey1.net/2020/04/05/google-app-engine-auto-scaling-setting-for-free/)
- [Running Next.js on GAE (Auto Deploy from Cloud Build)](https://zenn.dev/catnose99/articles/353664a9fe1f0f)

```yaml title=app.yaml
env: standard

runtime: nodejs14
instance_class: F1

service: default

handlers:
  - url: /_next/static
    static_dir: .next/static
  - url: /(.*\.(gif|png|jpg|ico|txt|svg|webp))$
    static_files: public/\1
    upload: public/.*\.(gif|png|jpg|ico|txt|svg|webp)$
  - url: /.*
    script: auto
    secure: always

default_expiration: "12h" # Cache duration for static files

env_variables:
  NODE_ENV: "production"

automatic_scaling:
  target_cpu_utilization: 0.95
  target_throughput_utilization: 0.95
  min_idle_instances: 0
  max_idle_instances: 1
  min_instances: 0
  max_instances: 1
  min_pending_latency: 5000ms
  max_pending_latency: automatic
  max_concurrent_requests: 80
```

Deploy via gcloud first to test. A `.gcloudignore` for Node will be auto-generated. You'll want to add unnecessary files like `coverage` to it.

```bash
gcloud app deploy app.yaml --project $PROJECT_ID
```

At this point, I needed to set up permissions. I ultimately enabled the following permissions:

- AppEngine (required for deploying to GAE)
- SecretManager (required for creating webhook secrets)
- Service Accounts (required for deploying via Cloud Build)

## Cloud Build Configuration

### Configuration File

```yaml title=cloudbuild.yaml
steps:
  - id: install packages
    name: node:14
    entrypoint: yarn
    args: ["install"]
  - id: build
    name: node:14
    entrypoint: yarn
    args: ["build"]
  - name: gcr.io/cloud-builders/gcloud
    args: ["app", "deploy", "app.yaml", "--project=$PROJECT_ID", "--quiet"]
```

Cloud Build has a feature that automatically substitutes variables. This time I used `$PROJECT_ID` to automatically substitute the deployment target.
For details, see [Substituting variable values](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values?_ga=2.127573001.-505764453.1652467842).

I also specified the Node version using the `node:${version}` format, just to be safe.

### Connecting Cloud Build with GitHub

Connect the [Google Cloud Build](https://github.com/marketplace/google-cloud-build) GitHub App.

After that, regardless of the project's region, create a trigger in the **"global" region** and connect it to the relevant GitHub repository.

I thought it would work in the same region, but I got the error `FAILED_PRECONDITION: generic::failed_precondition: no concurrent builds quota available to create builds.` ([reference](https://superuser.com/questions/1716674/error-by-trying-to-build-instance-via-ova-gc-sdk-genericfailed-precondition)).

Then push or manually trigger the build to check if it works. Also, it will error here without Service Accounts permissions.

### Creating a Webhook Trigger

Just select webhook. You'll need to create a secret key, so SecretManager permissions are required. You'll get an error if you don't specify the body with `-d`.

```bash
curl -X POST -d '{}' $preview_url
```
