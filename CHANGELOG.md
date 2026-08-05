# Changelog

## [0.8.0](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.7.1...v0.8.0) (2026-08-05)


### Features

* add method to git action test ([9197649](https://github.com/mehmettguzell/Devops-Todo-App/commit/9197649cf1b4699adc8670445b3175e12a25b97f))

## [0.7.1](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.7.0...v0.7.1) (2026-08-03)


### Bug Fixes

* run deploy job on manual workflow_dispatch too ([555f6f7](https://github.com/mehmettguzell/Devops-Todo-App/commit/555f6f7288328d05d6c0fc17c261043bf21c8b12))

## [0.6.2](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.6.1...v0.6.2) (2026-08-03)


### Bug Fixes

* rewrite docker-compose.yml on every deploy for self-healing ([7b0101a](https://github.com/mehmettguzell/Devops-Todo-App/commit/7b0101a6d44c327609284ce39f24aa2c0ea323d6))

## [0.6.1](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.6.0...v0.6.1) (2026-08-03)


### Bug Fixes

* deploy against :latest and fail loudly on deploy errors ([c4e2b75](https://github.com/mehmettguzell/Devops-Todo-App/commit/c4e2b75311aebd54f072f3ceee8ec1e085fea156))

## [0.6.0](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.5.0...v0.6.0) (2026-08-03)


### Features

* add CD pipeline to deploy to EC2 via SSM ([237e46d](https://github.com/mehmettguzell/Devops-Todo-App/commit/237e46d672b54f2b7a9b93beeb17ab0d249684f8))


### Bug Fixes

* stop tracking docker/.env, add .env.example instead ([d31405e](https://github.com/mehmettguzell/Devops-Todo-App/commit/d31405e850ea12d5fdc9c298ddd62ef7cf51df04))

## [0.5.0](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.4.0...v0.5.0) (2026-07-16)


### Features

* add test endpoint ([e8e5404](https://github.com/mehmettguzell/Devops-Todo-App/commit/e8e540452be4fc4141e5314817eb051d16a5ef07))

## [0.4.0](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.3.0...v0.4.0) (2026-07-13)


### Features

* add crud methods and tests ([ccef756](https://github.com/mehmettguzell/Devops-Todo-App/commit/ccef75685491ff02fcf07ebcca52d4bfeb0cfa4f))


### Bug Fixes

* fix bug and delete workflow ([df6a368](https://github.com/mehmettguzell/Devops-Todo-App/commit/df6a3689862f0e13818736f4027b0532596b1cdb))

## [0.3.0](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.2.0...v0.3.0) (2026-07-13)


### Features

* add daily capacity budget and finish-first progress panels ([f353187](https://github.com/mehmettguzell/Devops-Todo-App/commit/f353187da8daa9739c2817773cdbbf192ade761d))
* add DELETE /tasks/{task_id} endpoint ([32817b8](https://github.com/mehmettguzell/Devops-Todo-App/commit/32817b83c03a366b613d9a44c382b99210fa5922))
* add task backend, React frontend, and specs for Bitir ([c602831](https://github.com/mehmettguzell/Devops-Todo-App/commit/c6028314a751ac74fa4fc41ae16834b68cd1f7d6))
* add task fading, settings, and archive/due-date support ([6bb9519](https://github.com/mehmettguzell/Devops-Todo-App/commit/6bb9519f607ab9b59b3c8f105c07bc2a35944dcf))
* translate frontend to Turkish ([5d036f3](https://github.com/mehmettguzell/Devops-Todo-App/commit/5d036f3a4eabf2183357a976a9e020a549cc4464))
* wire up task deletion in the frontend ([9643231](https://github.com/mehmettguzell/Devops-Todo-App/commit/96432313aa0eb3e5acd77ebd034c429b105ef443))


### Bug Fixes

* add manual dispatch to build-push and resync release manifest ([fe447eb](https://github.com/mehmettguzell/Devops-Todo-App/commit/fe447ebc3b8de6e7379e01a73abcde5083455422))

## [0.2.0](https://github.com/mehmettguzell/Devops-Todo-App/compare/v0.1.0...v0.2.0) (2026-07-13)


### Features

* add daily capacity budget and finish-first progress panels ([f353187](https://github.com/mehmettguzell/Devops-Todo-App/commit/f353187da8daa9739c2817773cdbbf192ade761d))
* add DELETE /tasks/{task_id} endpoint ([32817b8](https://github.com/mehmettguzell/Devops-Todo-App/commit/32817b83c03a366b613d9a44c382b99210fa5922))
* add task backend, React frontend, and specs for Bitir ([c602831](https://github.com/mehmettguzell/Devops-Todo-App/commit/c6028314a751ac74fa4fc41ae16834b68cd1f7d6))
* add task fading, settings, and archive/due-date support ([6bb9519](https://github.com/mehmettguzell/Devops-Todo-App/commit/6bb9519f607ab9b59b3c8f105c07bc2a35944dcf))
* translate frontend to Turkish ([5d036f3](https://github.com/mehmettguzell/Devops-Todo-App/commit/5d036f3a4eabf2183357a976a9e020a549cc4464))
* wire up task deletion in the frontend ([9643231](https://github.com/mehmettguzell/Devops-Todo-App/commit/96432313aa0eb3e5acd77ebd034c429b105ef443))
