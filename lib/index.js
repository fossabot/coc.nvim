"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/******************************************************************
MIT License http://www.opensource.org/licenses/mit-license.php
Author Qiming Zhao <chemzqm@gmail> (https://github.com/chemzqm)
*******************************************************************/
const neovim_1 = require("neovim");
const logger_1 = require("./util/logger");
const index_1 = require("./util/index");
const config_1 = require("./config");
const buffers_1 = require("./buffers");
const completes_1 = require("./completes");
const remote_store_1 = require("./remote-store");
const remotes_1 = require("./remotes");
const fundebug = require("fundebug-nodejs");
fundebug.apikey = '08fef3f3304dc6d9acdb5568e4bf65edda6bf3ce41041d40c60404f16f72b86e';
let CompletePlugin = class CompletePlugin {
    constructor(nvim) {
        this.nvim = nvim;
        this.debouncedOnChange = index_1.contextDebounce((bufnr) => {
            this.onBufferChange(bufnr).catch(e => {
                logger_1.logger.error(e.message);
            });
            logger_1.logger.debug(`buffer ${bufnr} change`);
        }, 500);
        process.on('unhandledRejection', (reason, p) => {
            logger_1.logger.error('Unhandled Rejection at:', p, 'reason:', reason);
            if (reason instanceof Error) {
                nvim.call('complete#util#print_errors', [reason.stack.split(/\n/)]).catch(err => {
                    logger_1.logger.error(err.message);
                });
                if (!config_1.getConfig('noTrace') && process.env.NODE_ENV !== 'test') {
                    // fundebug.notifyError(reason)
                }
            }
        });
        process.on('uncaughtException', err => {
            index_1.echoErr(nvim, err.message);
            logger_1.logger.error(err.stack);
            if (!config_1.getConfig('noTrace') && process.env.NODE_ENV !== 'test') {
                // fundebug.notifyError(err)
            }
        });
    }
    onVimEnter() {
        return __awaiter(this, void 0, void 0, function* () {
            let { nvim } = this;
            try {
                yield this.initConfig();
                yield remotes_1.default.init(nvim);
                yield nvim.command('let g:complete_node_initailized=1');
                yield nvim.command('silent doautocmd User CompleteNvimInit');
                logger_1.logger.info('Complete service Initailized');
                // required since BufRead triggered before VimEnter
                let bufs = yield nvim.call('complete#util#get_buflist', []);
                for (let buf of bufs) {
                    this.debouncedOnChange(buf.toString());
                }
            }
            catch (err) {
                logger_1.logger.error(err.stack);
                return index_1.echoErr(nvim, `Initailize failed, ${err.message}`);
            }
        });
    }
    onBufUnload(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let bufnr = args[0].toString();
            buffers_1.default.removeBuffer(bufnr);
            logger_1.logger.debug(`buffer ${bufnr} remove`);
        });
    }
    onBufChange(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let bufnr = args[0].toString();
            this.debouncedOnChange(bufnr);
            logger_1.logger.debug(`buffer ${bufnr} change`);
        });
    }
    completeStart(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let opt = args[0];
            let start = Date.now();
            if (!opt)
                return;
            logger_1.logger.debug(`options: ${JSON.stringify(opt)}`);
            let { filetype, col } = opt;
            let complete = completes_1.default.createComplete(opt);
            let sources = yield completes_1.default.getSources(this.nvim, filetype);
            complete.doComplete(sources).then(items => {
                if (items === null)
                    items = [];
                logger_1.logger.debug(`items: ${JSON.stringify(items, null, 2)}`);
                if (items.length > 0) {
                    this.nvim.setVar('complete#_context', {
                        start: col,
                        candidates: items
                    });
                    this.nvim.call('complete#_do_complete', []).then(() => {
                        logger_1.logger.debug(`Complete time cost: ${Date.now() - start}ms`);
                    });
                }
            });
        });
    }
    completeResume(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let opt = args[0];
            if (!opt)
                return;
            let start = Date.now();
            logger_1.logger.debug(`options: ${JSON.stringify(opt)}`);
            let { filetype, col, input, word } = opt;
            let complete = completes_1.default.getComplete(opt);
            if (!complete)
                return;
            let { results } = complete;
            if (!results)
                return;
            let items = complete.filterResults(results, input, word);
            logger_1.logger.debug(`Resume items: ${JSON.stringify(items, null, 2)}`);
            if (!items || items.length === 0)
                return;
            this.nvim.setVar('complete#_context', {
                start: col,
                candidates: items
            });
            this.nvim.call('complete#_do_complete', []).then(() => {
                logger_1.logger.debug(`Complete time cost: ${Date.now() - start}ms`);
            });
        });
    }
    completeResult(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = args[0];
            let name = args[1];
            let items = args[2];
            logger_1.logger.debug(`items:${JSON.stringify(items, null, 2)}`);
            remote_store_1.default.setResult(id, name, items);
        });
    }
    onBufferChange(bufnr) {
        return __awaiter(this, void 0, void 0, function* () {
            let lines = yield this.nvim.call('getbufline', [Number(bufnr), 1, '$']);
            let content = lines.join('\n');
            if (/\u0000/.test(content))
                return;
            let keywordOption = yield this.nvim.call('getbufvar', [Number(bufnr), '&iskeyword']);
            buffers_1.default.addBuffer(bufnr, content, keywordOption);
        });
    }
    initConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            let { nvim } = this;
            let opts = yield nvim.call('complete#get_config', []);
            config_1.setConfig(opts);
        });
    }
};
__decorate([
    neovim_1.Autocmd('VimEnter', {
        sync: false,
        pattern: '*'
    })
], CompletePlugin.prototype, "onVimEnter", null);
__decorate([
    neovim_1.Function('CompleteBufUnload', { sync: false })
], CompletePlugin.prototype, "onBufUnload", null);
__decorate([
    neovim_1.Function('CompleteBufChange', { sync: false })
], CompletePlugin.prototype, "onBufChange", null);
__decorate([
    neovim_1.Function('CompleteStart', { sync: false })
], CompletePlugin.prototype, "completeStart", null);
__decorate([
    neovim_1.Function('CompleteResume', { sync: false })
], CompletePlugin.prototype, "completeResume", null);
__decorate([
    neovim_1.Function('CompleteResult', { sync: false })
], CompletePlugin.prototype, "completeResult", null);
CompletePlugin = __decorate([
    neovim_1.Plugin({ dev: false })
], CompletePlugin);
exports.default = CompletePlugin;
//# sourceMappingURL=index.js.map